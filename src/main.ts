import './main.css'
import { Dodge, DodgeScenes, type DodgeState } from './dodge'

const scoreDiv = document.getElementById('score')!

const state = new Proxy<DodgeState>(
  { isPaused: false, isOver: false, score: 0 },
  {
    set: (_state: DodgeState, key: string, newValue) => {
      switch (key) {
        case 'score':
          scoreDiv.innerText = newValue.toString()
          break
      }
      _state[key] = newValue
      _state.bestScore = Math.max(newValue, _state.bestScore ?? 0)

      return true
    },
  },
)

await (async () => {
  const game = new Dodge(state)
  await game.init({
    antialias: true,
    backgroundAlpha: 0,
    resizeTo: window,
  })
  document.body.appendChild(game.canvas)

  await game.playScene(DodgeScenes.Main)

  window.addEventListener('keydown', async (e) => {
    if (state.isOver && e.code === 'Escape') {
      state.score = 0
      state.isOver = false

      await game.playScene(DodgeScenes.Main)
    }
  })
})()
