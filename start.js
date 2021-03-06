var pull = require('pull-stream')
var notify = require('pull-notify')

module.exports = start

/*
  ┌────── effectActionStreams ◀───────┐
  ▼                                   |
actions ─▶ states ─▶ effects ─────────┘
  ▲          |
  |          └─────▶ models ─▶ views ─┐
  |                                   |
  └──────────  dispatch ◀─────────────┘
*/

function start (app) {
  var actions = notify()

  function dispatch (nextAction) {
    actions(nextAction)
  }

  var initialState = app.init()
  var states = notify()
  pull(
    actions.listen(),
    scan(initialState, function (state, action) {
      return app.update(state.model, action)
    }),
    pull.drain(states)
  )

  var models = notify()
  pull(
    states.listen(),
    pull.map(function (state) {
      return state.model
    }),
    difference(),
    pull.drain(models)
  )

  var views = notify()
  pull(
    models.listen(),
    pull.map(function (model) {
      return app.view(model, dispatch)
    }),
    pull.filter(isNotNil),
    pull.drain(views)
  )

  var effects = notify()
  pull(
    states.listen(),
    pull.map(function (state) {
      return state.effect
    }),
    pull.filter(isNotNil),
    pull.drain(effects)
  )

  var effectActionStreams = notify()
  pull(
    effects.listen(),
    pull.map(function (effect) {
      return app.run(effect, actions.listen)
    }),
    pull.filter(isNotNil),
    pull.drain(effectActionStreams)
  )

  pull(
    effectActionStreams.listen(),
    pull.flatten(),
    pull.drain(actions)
  )

  process.nextTick(function () {
    states(initialState)
  })

  return {
    stop: stop,
    actions: actions.listen,
    states: states.listen,
    models: models.listen,
    views: views.listen,
    effects: effects.listen,
    effectActionStreams: effectActionStreams.listen,
  }

  function stop () {
    ;[
      actions,
      states,
      models,
      views,
      effects,
      effectActionStreams
    ].forEach(function (stream) {
      stream.end()
    })
  }
}

function isNotNil (x) { return x != null }

// TODO extract out into `pull-scan`
function scan (value, accumulator) {
  return pull.map(function update (nextValue) {
    value = accumulator(value, nextValue)
    return value
  })
}

// TODO extract out into `pull-difference`
function difference () {
  var lastValue
  return pull.filter(function (value) {
    var condition = value !== lastValue
    lastValue = value
    return condition
  })
}
