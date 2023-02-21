import { gestures } from './gestures.js'
const config = {
  video: { width: 640, height: 480, fps: 60 }
}

const landmarkColors = {
  thumb: 'red',
  index: 'blue',
  middle: 'yellow',
  ring: 'green',
  pinky: 'pink',
  wrist: 'white'
}

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
  // Mão esquerda pra direita
  left: [...base].map(i => i.concat('Right')),
  // Mão direita pra esquerda
  right: [...base].map(i => i.concat('Left'))
}

// Tensorflow usa as soluções do mediapipe ML(machine learning) por baixo dos panos para implementar o modelo handpose do tensorflow
async function createDetector() {
  return window.handPoseDetection.createDetector(
    window.handPoseDetection.SupportedModels.MediaPipeHands,
    {
      runtime: 'mediapipe',
      modelType: 'full',
      maxHands: 2,
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`
    }
  )
}

async function main() {
  const video = document.querySelector('#pose-video')
  const canvas = document.querySelector('#pose-canvas')
  const ctx = canvas.getContext('2d')

  const resultLayer = {
    right: document.querySelector('#pose-result-right'),
    left: document.querySelector('#pose-result-left')
  }
  // configure gesture estimator
  // add "✌🏻" and "👍" as sample gestures
  const knownGestures = [
    fp.Gestures.VictoryGesture, // ✌🏻
    fp.Gestures.ThumbsUpGesture, // 👍
    ...gestures // ✊🏻, 🖐, ✂️, 🙅‍♂️
  ]

  // Aqui o GestureEstimator do fingerpose esta recebendo o array de gestos que foi importado do arquivo gestures.js e da propria lib fingerpose
  const GE = new fp.GestureEstimator(knownGestures)
  // load handpose model
  const detector = await createDetector()
  console.log('mediaPose model loaded')
  const pair = new Set() // é uma lista que não aceita repetição

  function checkGestureCombination(chosenHand, poseData) {
    console.log({ 'ChoseHand: ': chosenHand, 'Pose data: ': poseData })
    const addToPairIfCorrect = chosenHand => {
      const containsHand = poseData.some(finger => {
        // Ele busca em relação a direção da mão se esta pra esquerda ou direta. Se levantar a mão esquerda é porque ela esta pra direita
        console.log(dont[chosenHand])
        // ex de retorno: Horizontal Right includes Horizontal Right = true
        return dont[chosenHand].includes(finger[2])
      })
      if (!containsHand) return
      pair.add(chosenHand)
    }

    addToPairIfCorrect(chosenHand)
    if (pair.size !== 2) return
    resultLayer.left.innerText = resultLayer.right.innerText =
      gestureStrings.dont
    pair.clear()
  }
  // main estimation loop
  const estimateHands = async () => {
    // clear canvas overlay
    ctx.clearRect(0, 0, config.video.width, config.video.height)
    resultLayer.right.innerText = ''
    resultLayer.left.innerText = ''

    // Retorna um array quantas mãos foram detectadas e as coordenadas de cada ponto da mão, ou seja objetos com as coordenadas x e y e z
    // get hand landmarks from video
    const hands = await detector.estimateHands(video, {
      flipHorizontal: true
    })

    // Manipulando o array de mãos
    for (const hand of hands) {
      // Aqui as juntas
      for (const keypoint of hand.keypoints) {
        const name = keypoint.name.split('_')[0].toString().toLowerCase()
        const color = landmarkColors[name]
        drawPoint(ctx, keypoint.x, keypoint.y, 3, color)
      }

      // Aqui foi a manipulação dos dados para o novo modelo de ML que estamos usando
      const keypoints3D = hand.keypoints3D.map(keypoint => [
        keypoint.x,
        keypoint.y,
        keypoint.z
      ])
      const predictions = GE.estimate(keypoints3D, 9)

      // Aqui somente o debug ao lado do video para ver como que a gente pode criar os nossos gestos(gestures), especificamente o dont
      if (!predictions.gestures.length) {
        updateDebugInfo(predictions.poseData, 'left')
      }

      if (predictions.gestures.length > 0) {
        const result = predictions.gestures.reduce((p, c) =>
          p.score > c.score ? p : c
        )
        const found = gestureStrings[result.name]
        // find gesture with highest match score
        const chosenHand = hand.handedness.toLowerCase()
        updateDebugInfo(predictions.poseData, chosenHand)

        if (found !== gestureStrings.dont) {
          resultLayer[chosenHand].innerText = found
          continue
        }
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

async function initCamera(width, height, fps) {
  const constraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: width,
      height: height,
      frameRate: { max: fps }
    }
  }

  const video = document.querySelector('#pose-video')
  video.width = width
  video.height = height

  // get video stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  video.srcObject = stream

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function updateDebugInfo(data, hand) {
  const summaryTable = `#summary-${hand}`
  for (let fingerIdx in data) {
    document.querySelector(`${summaryTable} span#curl-${fingerIdx}`).innerHTML =
      data[fingerIdx][1]
    document.querySelector(`${summaryTable} span#dir-${fingerIdx}`).innerHTML =
      data[fingerIdx][2]
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initCamera(config.video.width, config.video.height, config.video.fps).then(
    video => {
      video.play()
      video.addEventListener('loadeddata', event => {
        console.log('Camera is ready')
        main()
      })
    }
  )

  const canvas = document.querySelector('#pose-canvas')
  canvas.width = config.video.width
  canvas.height = config.video.height
  console.log('Canvas initialized')
})
