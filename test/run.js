var test = require('tape')

var inu = require('../')
var pull = inu.pull

test('returning an effect from update triggers the run function', function (t) {
  var initialModel = {initial: true}
  var expectedEffect = {type: 'EXPECTED_EFFECT'}
  var app = {
    init: function () {
      return {model: initialModel}
    },
    update: function (model, action) {
      return {
        model: model,
        effect: expectedEffect
      }
    },
    view: function (model, dispatch) {
      dispatch()
      return inu.html`<div></div>`
    },
    run: function (effect) {
      t.equal(effect, expectedEffect, 'effect is equivalent to effect object returned in update')
      t.end()
    }
  }
  inu.start(app)
})

test('returning an effect from init triggers the run function', function (t) {
  var expectedEffect = {type: 'EXPECTED_EFFECT'}
  var app = {
    init: function () {
      return {effect: expectedEffect}
    },
    update: function (model, action) {
      return {
        model: model,
        effect: expectedEffect
      }
    },
    view: function (model, dispatch) {
      dispatch()
      return inu.html`<div></div>`
    },
    run: function (effect) {
      t.equal(effect, expectedEffect, 'effect is equivalent to effect object returned in init')
      t.end()
    }
  }
  inu.start(app)
})

test('returning an action from effect triggers the update function', function (t) {
  var initialModel = {initial: true}
  var expectedEffect = {type: 'EXPECTED_EFFECT'}
  var expectedAction = {type: 'EXPECTED_ACTION'}
  var app = {
    init: function () {
      return {
        model: initialModel,
        effect: expectedEffect
      }
    },
    update: function (model, action) {
      t.equal(action, expectedAction, 'Action passed to update is equivalent to the one returned in run')
      t.end()
      return {model: model}
    },
    view: function (model, dispatch) {
      return inu.html`<div></div>`
    },
    run: function (effect) {
      return pull.values([expectedAction])
    }
  }
  inu.start(app)
})

test('returning an action from effect emits actions on the action stream.', function (t) {
  var initialModel = {initial: true}
  var expectedEffect = {type: 'EXPECTED_EFFECT'}
  var expectedAction = {type: 'EXPECTED_ACTION'}
  var app = {
    init: function () {
      return {
        model: initialModel,
        effect: expectedEffect
      }
    },
    update: function (model, action) {
      return {model: model}
    },
    view: function (model, dispatch) {
      return inu.html`<div></div>`
    },
    run: function (effect) {
      return pull.values([expectedAction])
    }
  }
  var sources = inu.start(app)
  pull(sources.actions(), pull.take(1), pull.drain(function (action) {
    t.equal(action, expectedAction)
    t.end()
  }))
})

test('actions stream passed to run emits actions', function (t) {
  var initialModel = {initial: true}
  var expectedEffect = {type: 'EXPECTED_EFFECT'}
  var expectedAction = {type: 'EXPECTED_ACTION'}
  var app = {
    init: function () {
      return {
        model: initialModel,
        effect: expectedEffect
      }
    },
    update: function (model, action) {
      return {model: model}
    },
    view: function (model, dispatch) {
      return inu.html`<div></div>`
    },
    run: function (effect, sources) {
      const actions = sources.actions
      pull(actions(), pull.take(1), pull.drain(function (action) {
        t.equal(action, expectedAction)
        t.end()
      }))
      return pull.values([expectedAction])
    }
  }
  inu.start(app)
})

test('effects stream will not emit a effect if update returns a null effect', function (t) {
  t.plan(1)
  var initialModel = {initial: true }
  var app = {
    init: function () {
      return {model: initialModel}
    },
    update: function (model, action) {
      t.ok(model)
      return {model, effect: null}
    },
    view: function (model, dispatch) {
      dispatch()
    },
    run: function(effect) {
      t.error(effect)
    }
  }
  var sources = inu.start(app)

  pull(sources.effects(), pull.drain(function(model) {
    t.error(model)
  }))
})

test('effects stream will not emit a effect if update returns an undefined effect', function (t) {
  t.plan(1)
  var initialModel = {initial: true }
  var app = {
    init: function () {
      return {model: initialModel}
    },
    update: function (model, action) {
      t.ok(model)
      return {model, effect: undefined}
    },
    view: function (model, dispatch) {
      dispatch()
    },
    run: function(effect) {
      t.error(effect)
    }
  }
  var sources = inu.start(app)

  pull(sources.effects(), pull.drain(function(model) {
    t.error(model)
  }))
})
