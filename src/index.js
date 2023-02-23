import { gestures } from './gestures.js'

// Config do video, largura, altura e o fps. Fps maximo em navegadores é 60fps
const config = {
  video: { width: 640, height: 480, fps: 60 }
}

// Cor dos pontos que aparecem no video, de acordo com o nome de cada dedo
const landmarkColors = {
  thumb: 'red',
  index: 'blue',
  middle: 'yellow',
  ring: 'green',
  pinky: 'pink',
  wrist: 'white'
}

// Os gestos que irão aparecer na tela, caso bata com a implementação da logica que esta em gesture, se esta fechado ou não etc
const gestureStrings = {
  thumbs_up: '👍',
  victory: '✌🏻',
  rock: '✊️',
  paper: '🖐',
  scissors: '✌️',
  dont: '🙅‍♂️'
}

const base = ['Horizontal ', 'Diagonal Up ']
const dont = {
  // Mão esquerda pro lado direito
  left: [...base].map(i => i.concat('Right')),
  // Mão direita pro lado esquerdo
  right: [...base].map(i => i.concat('Left'))
}

// Tensorflow usa as soluções do mediapipe ML(machine learning) por baixo dos panos para implementar o modelo handpose do tensorflow
async function createDetector() {
  return window.handPoseDetection.createDetector(
    // Aqui estamos utilizando o modelo handPoseDetection do tensorflow
    window.handPoseDetection.SupportedModels.MediaPipeHands,
    {
      runtime: 'mediapipe',
      modelType: 'full',
      // Quantas mãos podem ser detectadas ao mesmo tempo
      maxHands: 2,
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`
    }
  )
}

async function main() {
  // Tag video
  const video = document.querySelector('#pose-video')
  // Pegando o contexto do canvas, pra colocar os pontos na mão
  const canvas = document.querySelector('#pose-canvas')
  const ctx = canvas.getContext('2d')

  // A onde ira aparecer o resultado da detecção da mão com os gestos, seja uma img ou gif ou emoji etc
  const resultLayer = {
    right: document.querySelector('#pose-result-right'),
    left: document.querySelector('#pose-result-left')
  }
  // configure gesture estimator
  // add "✌🏻" and "👍" as sample gestures and gestures.js
  // Os gestos que irão aparecer na tela(gestos conhecidos)
  const knownGestures = [
    // Esses dois gestos são do proprio fingerpose, ja com a logica do ml do fp implementada
    fp.Gestures.VictoryGesture, // ✌🏻
    fp.Gestures.ThumbsUpGesture, // 👍
    // Retorna um array com os gestos que foram importados do arquivo gestures.js com a devida logica de ml do fingerpose se esta fechando um dedo ou abrindo etc
    ...gestures // ✊🏻, 🖐, ✂️, 🙅‍♂️
  ]

  // Aqui o GestureEstimator do fingerpose esta recebendo o array de gestos que foi importado do arquivo gestures.js e da propria lib fingerpose. Ou seja o metodo Estimador de gestos pega os gestos conhecidos
  const GE = new fp.GestureEstimator(knownGestures)

  // load handpose model.
  const detector = await createDetector()
  console.log('mediaPose model loaded')

  // Essa lista faz parte da logica para fazer o dont
  const pair = new Set() // é uma lista que não aceita repetição

  // Verifica se tem as duas mãos e se estão fazendo o mesmo gesto
  function checkGestureCombination(chosenHand, poseData) {
    console.log({ 'ChoseHand: ': chosenHand, 'Pose data: ': poseData })
    
    const addToPairIfCorrect = chosenHand => {
      // A gente pega o primeiro dedo(some), no caso o thumb(dedado) e ve pra que lado esta sendo apontado e se esta nas posições horizontal ou Diagonal Up. Na posição 2 do array finger(dedo) ele me fala tudo isso, ex: Diagonal Up Right.
      // No fim estamos vendo se a mão esquerda e direta estão de forma horizontal ou Diagonal Up
      const containsHand = poseData.some(finger => {
        console.log('finger ',finger)
        // Ele busca dentro de dont(objeto) em relação a direção da mão(chosenHand), pois a direção é a chave, se esta pra esquerda ou direta. Se levantar a mão esquerda então ela esta apontando pra direita, com isso na chave left, ele retorna duas posições dentro do array: ['Horizontal Right', 'Diagonal Up Right'] e depois compara se dentro do finger[2] tem algum deles
        console.log(dont[chosenHand])
        // ex de retorno: dont[chosenHand].includes(Horizontal Right) = true
        return dont[chosenHand].includes(finger[2])
      })

      if (!containsHand) return
      // Se estiver horizontal ou Diagonal Up, adiciona a direção da mão dentro de pair, left ou right.
      pair.add(chosenHand)
    }

    addToPairIfCorrect(chosenHand)
    // O tamanho do pair tem que ser dois, ou seja duas mãos left e right
    if (pair.size !== 2) return
    // Se estiver com as duas mãos ele coloca o emoji dont na tela
    resultLayer.left.innerText = resultLayer.right.innerText =
      gestureStrings.dont
    pair.clear()
  }

  // main estimation loop. Estimativa das mãos para os gestoes em loop
  const estimateHands = async () => {
    // Limpa todas as informações do canvas, toda vez que mexer a mão:

    // clear canvas overlay. O método CanvasRenderingContext2D.clearRect() da API Canvas 2D limpa todos os pixels de um retângulo definido na posição (x, y) e tamanho (width (largura), height (altura)) para uma cor preta transparente, apagando algum conteúdo anterior. https://developer.mozilla.org/pt-BR/docs/Web/API/CanvasRenderingContext2D/clearRect
    ctx.clearRect(0, 0, config.video.width, config.video.height)
    // Limpa os resultados, no caso os emojis
    resultLayer.right.innerText = ''
    resultLayer.left.innerText = ''

    // Retorna um array das mãos que foram detectadas e as coordenadas de cada ponto da mão, ou seja objetos com as coordenadas x e y e z dos dedos, da palma mão, o lado da mão etc.
    // handpose model estimativa de quantas mão estão aparecendo no video
    // get hand landmarks from video
    const hands = await detector.estimateHands(video, {
      // Ele inverte a camera pro handpose model entender qual é a mão direita e esquerda corretamente
      flipHorizontal: true
    })

    // Manipulando o array de mãos, no nosso caso 2 mãos, ou seja manipulando cada uma delas a right e a left
    // Deixando claro que os keypoints são as coordenadas das juntas de tal dedo ou da palma da mão
    for (const hand of hands) {
      // Manipulando as juntas(keypoints) da mão. A mão retorna as chaves dos pontos da mão, ou seja a propria palma da mão(wrist) possui um ponto e as juntas dos dedos tambem, o lado da mão(handedness) e score. Pra cada ponto ele retora o nome desse ponto, que são as juntas da quele dedo ou a propria palma da mão.
      // console.log(hand)
      for (const keypoint of hand.keypoints) {
        // Pode ser a palma da mão ou ate mesmo a junta do dedo indicador etc. Pega todos os nomes das juntas
        const name = keypoint.name.split('_')[0].toString().toLowerCase()
        // Pra cada junta de tal dedo uma cor
        const color = landmarkColors[name]
        // Colocando os pontos na mão. Passando o canvas, os pontos da mão(as juntas), no caso a coordenada de cada junta pra cada ponto colorido ficar no video e as cores que é pra cada junta de tal dedo é uma cor, por exemplo pro dedo indicador é o blue
        // console.log(color)
        drawPoint(ctx, keypoint.x, keypoint.y, 3, color)
      }

      // Aqui foi a manipulação dos dados para o novo modelo de ML que estamos usando. Pegando novamente os pontos(as juntas) de cada mão  e retornado como um array. E dentro desse array é retornado as 21(4 de cada dedo e 1 na palma da mão) juntas da nossa mão, que são arrays com x,y e z. Ou seja as coordenadas de cada junta da mão
      const keypoints3D = hand.keypoints3D.map(keypoint => [
        keypoint.x,
        keypoint.y,
        keypoint.z
      ])

      // console.log(keypoints3D)

      // previsões de estimativa de acordo com os keypoint pro fingerpose para os gestos. Nesse caso ele retorna dois objetos um poseData e um gesture. O pose data retorna os dedos e se ele esta no curl, horizontal de acordo com os keypoints de cada juntas dos dedos e da palma da mão. E o gesture é caso se ele fizer o posição correta pra tal gesto colocado la em cima em const GE = new fp.GestureEstimator(knownGestures) que foi definido a logica de cada gesto em gesture.js ou da propria lib fingerpose por exemplo fp.Gestures.VictoryGesture que ja retorna a implementação de dois gestos e que foi colocado dentro de um array com o nome knownGestures e passado pro fp. Ou seja passando os keypoints da mão pro fp e o knownGestures, ele vai saber se esta nocurl, horizontal etc e se bater com a logica de tal gesto colocado aqui GestureEstimator, ele aparece na tela.
      // Resumindo: de acordo com as coordenadas das juntas das mãos o fp vai saber me falar se o dedo esta full curl, no curl, pra qual direção esta apontando aquele dedo. com isso, retornando a poseData, que nada mais é a posição do dedo e o gesture, o gesto formado pelos dedos.
      // O 9 é o score do dedo, ou seja se o score for maior que 9, ele vai retornar o gesto. Ou seja, score seria por exemplo pra ele aceitar eu fazer o papel com um dedo meu que quase não abre direito, é meio torto etc.
      const predictions = GE.estimate(keypoints3D, 9)
      // console.log(predictions)

      // Aqui somente o debug ao lado do video para ver como que a gente pode criar os nossos gestos(gestures), especificamente o dont
      if (!predictions.gestures.length) {
        updateDebugInfo(predictions.poseData, 'left')
      }

      // Se nas predições em gesture tiver alguma coisa, é porque os keypoints dos dedos bateu com alguma logica dos gestos colocado em gesture no metodo GestureDescription, com isso pega o nome desse gesto que foi colocado la e compara com os nomes dentro do objeto gestureStrings, se bater, ele coloca a string do gesto na tela
      if (predictions.gestures.length > 0) {
        // O result, retorna um objeto de duas posições que tem dentro de gesture, que é o score e o nome do gesto
        const result = predictions.gestures.reduce((p, c) =>
          p.score > c.score ? p : c
        )
        // console.log(result)

        // Found retorna o valor(emoji do gesto) da chave passada result.name pro objeto gestureStrings.
        const found = gestureStrings[result.name]
        // find gesture with highest match score. handedness o lado da mão aparecendo no video e o predictions.poseData é cada info dos dedos se esta nocurl, horizontal etc, passado pro debuginfo
        const chosenHand = hand.handedness.toLowerCase()
        updateDebugInfo(predictions.poseData, chosenHand)

        // Se o found for diferente da chave dont do objeto gestureStrings, então continue o loop normalmente
        if (found !== gestureStrings.dont) {
          // Resultado da mão, seja ela esquerda ou direta
          resultLayer[chosenHand].innerText = found
          continue
        }
        // Um metodo de combinação de duas mãos pra fazer o dont
        checkGestureCombination(chosenHand, predictions.poseData)
      }
    }
    // ...and so on
    setTimeout(() => {
      estimateHands()
    }, 1000 / config.video.fps)
  }

  estimateHands()
  console.log('Starting predictions')
}

// Para iniciar a camera
async function initCamera(width, height, fps) {
  // restrições do video, ou melhor dizendo, um objeto de config do video
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode
  const constraints = {
    audio: false,
    video: {
      // A propriedade faceMode do dicionário MediaTrackConstraints é uma ConstrainDOMString que descreve as restrições solicitadas ou obrigatórias colocadas sobre o valor da propriedade constrainable facesMode.
      facingMode: 'user',
      // os valores são passados dinamicamente por parametro, supostamente vindo do objeto config
      width: width,
      height: height,
      frameRate: { max: fps }
    }
  }

  // tag video e seta os valores
  const video = document.querySelector('#pose-video')
  video.width = width
  video.height = height

  // get video stream
  // O método MediaDevices.getUserMedia() solicita ao usuário permissão para usar uma entrada de mídia que produz um MediaStream com faixas contendo os tipos de mídia solicitados. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  // A propriedade srcObject da interface HTMLMediaElement define ou retorna o objeto que serve como fonte da mídia associada ao HTMLMediaElement. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
  video.srcObject = stream

  return new Promise(resolve => {
    // O evento loadmetadata é acionado quando os metadados são carregados. Um event
    // https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
    // https://www.freecodecamp.org/portuguese/news/tutorial-de-promises-do-javascript-resolve-reject-e-encadeamento-em-js-e-na-es6/
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}

// Pra desenhar Pontos da mão. Necessariamente não precisa disso, mas é uma forma de debugar
function drawPoint(ctx, x, y, r, color) {
  // Ctx é o contexto do canvas, pra colocar os pontos na mão

  // O método CanvasRenderingContext2D.beginPath() da API Canvas 2D inicia um novo caminho (path), esvaziando a lista de sub-caminhos (sub-paths). Use esse método quando você quiser criar um novo path. https://developer.mozilla.org/pt-BR/docs/Web/API/CanvasRenderingContext2D/beginPath
  ctx.beginPath()
  // O método CanvasRenderingContext2D.arc() da API Canvas 2D adiciona um arco circular para o atual sub-caminhoa (sub-path). https://developer.mozilla.org/pt-BR/docs/Web/API/CanvasRenderingContext2D/arc
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  // A propriedade CanvasRenderingContext2D.fillStyle da API do Canvas 2D especifica a cor ou o estilo para usar regiões internas. O valor inicial é #000 (preto).
  ctx.fillStyle = color
  // O método CanvasRenderingContext2D.fill() da API Canvas 2D preenche um dado path ou o path atual com o estilo atual de preenchimento usando uma regra de controle diferente de zero, ou uma regra par-ímpar.
  ctx.fill()
}

// Debug ao lado do video
function updateDebugInfo(data, hand) {
  // Pega o id da tabela de resumo de cada mão, passado o lado da mão como parametro, ex: summary-left
  const summaryTable = `#summary-${hand}`
  // Coloca o valor de cada dedo na tabela de resumo, cada array de cada lado da mão(data, ou seja o predictions.poseData) possui 5 posições/dedos e cada um desses dedos(fingerIdx) me retorna um array de tres posições de objetos, a primeira[0] o dedo, a segunda[1] se esta aberto ou não(curl) e a terceira[2] direção dele.ex: 4:(3) ['Pinky', 'No Curl', 'Vertical Up']
  for (let fingerIdx in data) {
    // Se o dedo esta aberto ou fechado(Curl)
    document.querySelector(`${summaryTable} span#curl-${fingerIdx}`).innerHTML =
      data[fingerIdx][1]
    // Qual direção esta indo o dedo(Direction)
    document.querySelector(`${summaryTable} span#dir-${fingerIdx}`).innerHTML =
      data[fingerIdx][2]
  }
}

// Coloca o video na tela
// O evento DOMContentLoaded é acionado quando todo o HTML foi completamente carregado e analisado, sem aguardar pelo CSS, imagens, e subframes para encerrar o carregamento. Um evento muito diferente - load (en-US) - deve ser usado apenas para detectar uma página completamente carregada. É um engano comum as pessoas usarem load (en-US) quando DOMContentLoaded seria muito mais apropriado. https://developer.mozilla.org/pt-BR/docs/Web/API/Window/DOMContentLoaded_event ou https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
window.addEventListener('DOMContentLoaded', () => {
  // Chama esse metodo pra iniciar a camera
  // .then ou poderia ser um await, porque o initCamera retorna uma promise de evento da tag video que retorna quando os metadados são carregados da tag video e dessa forma ele consegue dar play no que é retornado na promise, iniciando posteriormente o metodo main()
  // Como valores pros parametros de configuração do video a gente passa o objeto config
  initCamera(config.video.width, config.video.height, config.video.fps).then(
    video => {
      video.play()
      video.addEventListener('loadeddata', event => {
        console.log('Camera is ready')
        main()
      })
    }
  )

  // Inicia o canvas, para aparecer os pontinhos
  const canvas = document.querySelector('#pose-canvas')
  canvas.width = config.video.width
  canvas.height = config.video.height
  console.log('Canvas initialized')
})
