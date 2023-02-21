# Fingerpose e TensorFlow multiplos gestos

## Sobre:

O TensorFlow nada mais é que uma lib de ML(machine learning) da Google que usa por de baixo dos panos o MediaPipe com suas soluções para implementar modelos de ML/sub api's que possam ser usadas do lado do front-end que retornam dados, que são arrays de varias posições de pontinhos das mãos, dedos e as juntas [x, y, z], ou seja um plano cartesiano pra cada pontinho de acordo com a posição da sua mão no video da webcam. Com isso, é possivel manipular cada objeto/ponto da mão. E o fingerpose outra lib, que por sua vez abstrai mais ainda, usando por baixo dos panos o TensorFlow, podendo usar ML do lado do front sem precisar saber cada posição e calcular a distancia um do o outro, calcular se esta fechado(No curl, half curl etc) ou não, calcular se esta na horizontal ou vertical, mas sim, qual dedo esta fechado percorrendo eles por array de objetos, porque um dedo é um objeto, por exemplo o Index, é o dedo indicador e usando por exemplo noCurl full ele tem que estar totalmente aberto etc, ele ja entrega tudo isso, basta fazer somente a logica.

## Links importantes:

- [TensorFlow](https://www.tensorflow.org/resources/libraries-extensions?hl=pt-br)
  - [Models Tensor Flow](https://github.com/tensorflow/tfjs-models)
  - [TensorFlow.js Examples](https://github.com/tensorflow/tfjs-examples/)
- mediapipe.dev

- Ex de modelos do TensorFlow e soluções do MediaPipe:
  - [Face Detection TensorFlow](https://github.com/tensorflow/tfjs-models/tree/master/face-detection)
    - [MediaPipe Face Detection solution](https://google.github.io/mediapipe/solutions/face_detection.html)
  - [Hand Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
    - [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)

- Documentação do Fingerpose do andypotato usando o modelo handpose: Para somente uma mão
  - [Lib Fingerpose que usa o TensorFlow](https://github.com/andypotato/fingerpose)
    - [Npm FingerPose](https://www.npmjs.com/package/fingerpose)
    - [MediaPipe Handpose TensorFlow](https://github.com/tensorflow/tfjs-models/tree/master/handpose)

- Documentação do Fingerpose do ErickWendel usando  o modelo hand-pose-detection: Para duas mãos
  - [Lib Fingerpose que usa o TensorFlow](https://github.com/ErickWendel/fingerpose)
    - [Hand Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)

- Projetos com fingerpose do andypotato:
  - [Pedra, papel, tesoura](https://github.com/andypotato/rock-paper-scissors)
    - [Gestos](https://github.com/andypotato/rock-paper-scissors/blob/master/src/js/Gestures.js)


## Como usar as libs:

- Projeto JS puro/vanilla via injeção das dependencias no html nas tags script: https://www.jsdelivr.com/?query=fingerpose e dependencias do [MediaPipe Handpose TensorFlow](https://github.com/tensorflow/tfjs-models/tree/master/handpose)

- Projeto JS puro/vanilla ou React ou Angular etc via import: npm install fingerpose e dependencias do [MediaPipe Handpose TensorFlow](https://github.com/tensorflow/tfjs-models/tree/master/handpose)

## Referencias:

- https://github.com/ErickWendel/fingerpose
-  Rock, Paper & Scissors: https://github.com/andypotato/rock-paper-scissors
-  Pacman: https://storage.googleapis.com/tfjs-examples/webcam-transfer-learning/dist/index.html
-  https://github.com/tensorflow/tfjs-examples/
-  https://www.npmjs.com/package/fingerpose
-  https://github.com/andypotato/rock-paper-scissors/blob/master/src/js/Gestures.js
-  https://www.tensorflow.org/js/demos
-  https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection#mediapipe-hands-keypoints-used-in-mediapipe-hands
- [Live do Erick Wendel](https://www.youtube.com/watch?v=MeS6dX2a2zQ)

## Outras libs usadas:

- [browser-sync](https://browsersync.io) Para subir o projeto ou pode usar o proprio Open with live server