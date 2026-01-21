import './main.css'
import Dodge from './dodge/game'

await (async () => {
  await Dodge.init({
    resizeTo: window,
    backgroundAlpha: 0,
  })
  document.body.appendChild(Dodge.canvas)

  await Dodge.play('main')
})()
