# RESPUESTAS

### _¿Qué archivo contiene la regla de cálculo?_

- La regla de calculo la contiene el archivo precios.ts, ubicado en la carpeta src/services. ahi se encuentra la funcion calcularPrecioFinal.

### _¿Qué archivo define la ruta HTTP?_

- Las rutas HTTP estan definidas en el app.ts, a la misma altura que la carpeta services dentro de src. Ahi se encuentran todos los endpoints que va a usar la aplicacion.

### _¿En qué se diferencian sus responsabilidades?_

- Sus responsabilidades se diferencian de una forma bastante simple, el app.ts define las rutas a las que se puede acceder siendo un usuario, todo lo que puede hacer, mientras que el precios.ts provee la herramienta que deben usar esos endpoints para hacer lo que el usuario requiere. En app.ts esta el endpoint para calcular el precio (lo que puede hacer), y en precios.ts esta la funcion que calcula el precio (con qué lo puede hacer).
- Ademas, app.ts es el que se encarga de "hablar" con el usuario: recibe los datos de la peticion, se los pasa a la funcion y despues traduce lo que pasó en una respuesta HTTP (200 si salio bien, 400 si los datos eran invalidos, 500 si hubo otro error). En cambio, precios.ts no sabe nada de HTTP ni de usuarios, solo sabe hacer la cuenta.

### _Mirando la prueba con calcularPrecioFinal(1000, 150), ¿qué comportamiento exige?_

- La prueba le pasa a la funcion un precio de 1000 con un descuento del 150% (mayor al total, algo que no tiene sentido) y exige que la funcion **no haga la cuenta** y en su lugar **lance** un error del tipo `RangeError` (`toThrow(RangeError)`). Es decir, espera que la funcion detecte que el descuento es invalido y lo rechace.

### _¿Qué hace realmente el código?_

- El codigo no hace lo que la prueba exige. La funcion no revisa los datos que recibe: aplica la formula directamente y devuelve -500, un precio negativo, sin lanzar ningun error. La cuenta en si esta bien hecha, pero el problema es que acepta un descuento que no tiene sentido. Lo ideal seria que rechace ese tipo de valores antes de calcular, y como no lo hace, la prueba falla.

### _¿Qué total devuelve actualmente un descuento del 150 % sobre $1.000?_

- Devuelve **-500**. La funcion hace la cuenta 1000 - (1000 x 150 / 100), o sea 1000 - 1500, y el resultado es -500.

### _¿Por qué ese resultado no cumple la regla de negocio?_

- Porque en la vida real un precio final no puede ser negativo: significaria que el negocio le tiene que pagar al cliente por llevarse el producto. Ademas, un descuento mayor al 100 % no tiene sentido, ya que el maximo posible es regalar el producto (100 %, precio 0). Entonces el valor de entrada ya es invalido y la funcion deberia haberlo rechazado en lugar de calcular con el.

### _¿Por qué la prueba falla si la función terminó de ejecutarse?_

- Porque la prueba no esperaba que la funcion terminara bien, esperaba que **lanzara un error** (`toThrow(RangeError)`). Que una funcion termine sin problemas no significa que haya hecho lo correcto. En este caso, la prueba esperaba que la funcion "se negara" a calcular con un descuento invalido, pero la funcion termino normalmente y devolvio -500. Como el error esperado nunca aparecio, la expectativa no se cumplio y la prueba fallo. Vitest lo indica con el mensaje: _"expected function to throw an error, but it didn't"_ (se esperaba que la funcion lanzara un error, pero no lo hizo).
- Por eso la funcion se escribe dentro de `() => ...`: asi Vitest es el que la ejecuta y puede "atrapar" el error si aparece. Si se pasara el resultado directo, el error (si existiera) ocurriria antes de que Vitest pueda revisarlo.

### _¿La validación actual rechaza `NaN` como precio?_

- Si, la rechaza. Se agrego la prueba `expect(() => calcularPrecioFinal(NaN, 10)).toThrow(RangeError)` y al correr `npm test` pasa. La validacion usa `Number.isFinite(precio)`, que solo acepta numeros "normales" y descarta `NaN` (que significa "no es un numero") y tambien `Infinity`. Como `NaN` no pasa esa revision, la funcion lanza un `RangeError` y la prueba pasa.
- Lo mismo pasa con el descuento, porque tambien se valida con `Number.isFinite(descuento)`. Esto ademas rechaza otros valores que no son numeros, como un texto (`"abc"`) o un dato que falta (`undefined`), que podrian llegar si alguien manda una peticion incompleta o mal armada a la API.
- Es un caso interesante porque si la validacion fuera solamente `precio < 0`, `NaN` **pasaria sin ser detectado**, ya que cualquier comparacion con `NaN` da falso (`NaN < 0` es falso). La funcion calcularia con `NaN` y devolveria `NaN` como precio. Por eso no alcanza con revisar que el numero no sea negativo: tambien hay que revisar que sea un numero valido.

### _¿Por qué esta prueba es de integración y no solamente una prueba unitaria?_

- Porque no prueba una sola pieza aislada, sino **varias partes del sistema trabajando juntas**. En esta prueba se simula una peticion real a la API y participan:
  1. Express, que recibe la peticion y lee el JSON con el precio y el descuento.
  2. La ruta `/api/precios/calcular` de `app.ts`, que saca esos datos y se los pasa al servicio.
  3. La funcion `calcularPrecioFinal` de `precios.ts`, que detecta el descuento invalido y lanza el error.
  4. De nuevo la ruta, que atrapa ese error y lo convierte en una respuesta HTTP 400 con un mensaje de error.
- Una prueba unitaria, en cambio, solo llama a la funcion directamente y revisa lo que devuelve, sin pasar por Express ni por las rutas. Esta prueba de integracion comprueba que todas esas piezas se "entiendan" entre si: que el error que lanza el servicio realmente le llegue al usuario como un 400 y no, por ejemplo, como un 500 o un precio negativo.

### _¿Por qué conviene utilizar tanto `typecheck` como `npm test`?_

- Al ejecutar `npm run typecheck` el comando termino sin errores, y `npm test` mostro que todas las pruebas pasan. Pero cada uno revisa algo distinto, por eso conviene usar los dos:
  - `npm run typecheck` revisa el codigo **sin ejecutarlo**, buscando errores de tipos, por ejemplo pasar un texto donde la funcion espera un numero. Detecta errores de "forma" antes de que el programa se use.
  - `npm test` **ejecuta** el codigo y comprueba que haga lo correcto, por ejemplo que 1000 con 10 % de descuento de 900.
- Un codigo puede tener los tipos perfectos y aun asi calcular mal (eso solo lo detectan las pruebas), o puede pasar las pruebas pero tener un error de tipos en una parte que las pruebas no cubren (eso lo detecta el typecheck).
- Ademas, Node ejecuta los archivos `.ts` sin revisar los tipos, asi que si solo usaramos `npm test` esos errores pasarian desapercibidos.
- Un detalle importante: TypeScript no puede garantizar que los datos que llegan por HTTP sean del tipo correcto, porque el contenido de la peticion (`req.body`) puede ser cualquier cosa que mande el usuario. Por eso, aunque el typecheck no marque errores, igual hace falta validar los datos dentro de la funcion mientras el programa se ejecuta.

## Registro de resultados

| Comprobación | Resultado | Observación |
| --- | --- | --- |
| Respuesta de `GET /healthy` | `{"estado":"ok"}` | En el codigo original la ruta se llamaba `/salud` y no `/healthy` como decia la guia. Se renombro en `app.ts` para que coincida con la guia, y se actualizo tambien la prueba en `api.test.ts`. |
| Primera ejecución de `npm test` | 4 pasan, 1 falla | Falla `rechaza descuentos superiores al 100 %`: la funcion devuelve -500 en lugar de lanzar `RangeError`. |
| Corrección del servicio | Todas pasan | Se agregaron validaciones con `Number.isFinite` y rangos (precio mayor o igual a 0, descuento entre 0 y 100). La prueba que fallaba ahora pasa y las demas siguen funcionando. |
| Nuevas pruebas unitarias | Todas pasan (7 en `precios.test.ts`) | Se agregaron pruebas para descuento del 100 % (total 0), precio negativo, descuento negativo y precio `NaN`. |
| Prueba de integración HTTP 400 | Pasa (10 de 10 en total) | La ruta convierte el `RangeError` del servicio en una respuesta 400 con la propiedad `error`. No hizo falta modificar `app.ts`. |
| Verificación `npm run typecheck` | Sin errores | El analisis de tipos no encontro problemas. |

### _¿Qué diferencia hay entre comprobar manualmente una respuesta y ejecutar una prueba automatizada?_

- Comprobar manualmente significa que una persona prueba la aplicacion a mano (por ejemplo, abriendo el navegador o usando `curl`) y mira si el resultado es el correcto. Esto depende de que la persona se acuerde de hacerlo, de que revise bien el resultado y de que pruebe siempre los mismos casos. Es lento y facil de olvidar o hacer distinto cada vez.
- Una prueba automatizada es codigo que hace esa misma revision por nosotros. Se escribe una vez y se puede ejecutar todas las veces que queramos con un solo comando, en segundos, y siempre revisa exactamente lo mismo. Ademas, queda guardada en el proyecto como una especie de "documentacion" de como deberia comportarse el sistema, y se puede ejecutar automaticamente (por ejemplo con GitHub Actions cada vez que se sube un cambio).

### _¿Cuál fue la causa de la primera prueba fallida?_

- La causa fue que la funcion `calcularPrecioFinal` **no validaba los datos que recibia**. Aceptaba cualquier precio y cualquier descuento y hacia la cuenta igual, aunque los valores no tuvieran sentido. Por eso, con un descuento del 150 %, devolvia un precio negativo (-500) en lugar de rechazar el dato con un `RangeError`, que era lo que la prueba esperaba.

### _¿Por qué es útil incluir casos inválidos además de los casos habituales?_

- Porque los errores casi nunca aparecen con los datos "normales": aparecen cuando alguien manda algo inesperado. Si solo probamos los casos habituales (como 1000 con 10 % de descuento), nunca nos enteramos de que la funcion acepta un descuento de 150 % o un precio negativo. Justamente eso fue lo que paso en esta practica: los casos normales funcionaban bien y el problema estaba escondido en un caso invalido.
- Desde el punto de vista de la **ciberseguridad** esto es todavia mas importante. Muchos ataques consisten en mandarle a una aplicacion datos que no espera (numeros negativos, textos donde va un numero, valores enormes, etc.) para ver si se rompe o se comporta de forma rara. Por ejemplo, si una tienda online aceptara un descuento del 150 %, alguien podria aprovecharlo para que el precio quede negativo. Validar las entradas es una de las defensas mas basicas, y probar los casos invalidos es la forma de asegurarnos de que esa defensa realmente funciona.

### _¿Qué parte del sistema comprueba `tests/precios.test.ts` y qué partes comprueba `tests/api.test.ts`?_

- `tests/precios.test.ts` comprueba **solamente la funcion de calculo** (`calcularPrecioFinal` en `precios.ts`), de forma aislada. Le pasa numeros directamente y revisa que devuelva el resultado correcto o que lance un error cuando corresponde. No participa ni Express ni ninguna ruta. Son pruebas **unitarias**.
- `tests/api.test.ts` comprueba **la aplicacion completa vista desde afuera**, como la usaria un cliente: hace peticiones HTTP y revisa las respuestas. Ahi participan Express, la lectura del JSON, las rutas definidas en `app.ts`, la funcion de calculo y la conversion de los errores en codigos HTTP (200, 400). Son pruebas de **integracion**.

### _¿Qué ventajas ofrece ejecutar las pruebas después de cada modificación?_

- Permite detectar un error **en el momento en que se introduce**. Si algo se rompe, sabemos que fue por el ultimo cambio que hicimos, y es mucho mas facil encontrarlo y arreglarlo que si nos enteramos semanas despues.
- Evita las "regresiones", que es cuando algo que antes funcionaba deja de funcionar por un cambio nuevo. Por ejemplo, al agregar las validaciones podriamos haber roto sin querer el calculo normal; las pruebas existentes lo hubieran detectado al instante.
- Da **confianza para modificar el codigo**. Sabiendo que las pruebas nos avisan si algo sale mal, podemos mejorar o reorganizar el codigo sin miedo.
- Permite ver claramente el paso de "rojo" (la prueba falla) a "verde" (la prueba pasa), que confirma que la correccion realmente soluciono el problema.
