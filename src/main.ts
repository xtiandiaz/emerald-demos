import './main.css'
import Dodge from './dodge/game'

await (async () => {
  await Dodge.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
  })
  document.body.appendChild(Dodge.canvas)

  await Dodge.play('main')
})()
