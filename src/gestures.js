// import { GestureDescription, Finger, FingerCurl } from 'fingerpose';

// Aqui fica somente a logica pra cada gesto, ou seja da lib do fp. Que posteriormente esse arquivo é  usado no metodo do fp no index.js GestureEstimator(). E no metodo estimate() é passado os keypoints3D(AS JUNTAS DA MÃO) que caso os gestos dos dedos batam com o que esta aqui, aparecera o gesto feito no video com um emoji, por exemplo o rock.

// Pegando as depedencias do FingerPose atraves do window, https://cdn.jsdelivr.net/npm/fingerpose@0.1.0/dist/fingerpose.min.js" type="text/javascript
const { GestureDescription, Finger, FingerCurl, FingerDirection } = window.fp

// Colocando os gestos no GestureDescription do fp 
const rockGesture = new GestureDescription('rock') // ✊️
const paperGesture = new GestureDescription('paper') // 🖐
const scissorsGesture = new GestureDescription('scissors') // ✂️
const dontGesture = new GestureDescription('dont') // 🙅‍♂️

// Implementando a logica de cada gesto

// Rock
// -----------------------------------------------------------------------------

// thumb: half curled
// accept no curl with a bit lower confidence
rockGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0)
rockGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5)

// all other fingers: curled
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  rockGesture.addCurl(finger, FingerCurl.FullCurl, 1.0)
  rockGesture.addCurl(finger, FingerCurl.HalfCurl, 0.9)
}

// Paper
// -----------------------------------------------------------------------------

// no finger should be curled
for (let finger of Finger.all) {
  paperGesture.addCurl(finger, FingerCurl.NoCurl, 1.0)
}

// Scissors
//------------------------------------------------------------------------------

// index and middle finger: stretched out
scissorsGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0)
scissorsGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0)

// ring: curled
scissorsGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0)
scissorsGesture.addCurl(Finger.Ring, FingerCurl.HalfCurl, 0.9)

// pinky: curled
scissorsGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0)
scissorsGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.9)


// Dont 🙅‍♂️
// -----------------------------------------------------------------------------
for(let finger of Finger.all){
  dontGesture.addCurl(finger, FingerCurl.NoCurl, 1.0)
  dontGesture.addCurl(finger, FingerCurl.HalfCurl, 0.8)

  dontGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 1.0)
  dontGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 1.0)

  dontGesture.addDirection(finger, FingerDirection.HorizontalRight, 1.0)
  dontGesture.addDirection(finger, FingerDirection.HorizontalLeft, 1.0)
}


const gestures = [rockGesture, paperGesture, scissorsGesture, dontGesture]
export { gestures }
