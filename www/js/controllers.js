var firebase = new Firebase('http://emogotchi.firebaseio.com')

angular.module('starter.controllers', [])


// A simple controller that fetches a list of data from a service
.controller('PetIndexCtrl', function($scope, PetService) {
  // "Pets" is a service returning mock data (services.js)
  $scope.pets = PetService.all();
})


// A simple controller that shows a tapped item's data
.controller('PetDetailCtrl', function($scope, $stateParams, PetService) {
  // "Pets" is a service returning mock data (services.js)
  $scope.pet = PetService.get($stateParams.petId);
})

.controller('PetCtrl', function($scope, $stateParams){
  newGame({
    $scope: $scope,
    isPet: true,
    petRef: firebase.child("pets/katan"), 
    careRef: firebase.child("cares/vic")
  })
})

.controller('CareCtrl', function($scope, $stateParams){
  newGame({
    $scope: $scope,
    isPet: false,
    petRef: firebase.child("pets/katan"), 
    careRef: firebase.child("cares/vic")
  })
})

function newGame(mode){ 
  var game, pet, actions_group, 
      action_clean,
      draggable_tools, plates_group, poops_group

  game = new Phaser.Game(478, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update })

  function preload() {
    game.load.image('actions-button', 'img/ionic.png');
    game.load.atlasJSONHash('perrito', 'img/perrito.png', 'img/perrito.json');
  }

  function create() {
    pet = game.add.sprite(game.world.centerX, game.world.centerY, 'perrito', 'cola1.png')
    pet.scale.setTo(0.4, 0.4)
    pet.anchor.setTo(0.5, 0.5)
    pet.animations.add('colita', ['cola1.png', 'cola2.png', 'cola3.png'], 3, true, false)
    pet.animations.play('colita')

    plates_group = game.add.group(null, 'plates')
    plates_group.named = {}

    poops_group = game.add.group(null, 'poops')
    poops_group.named = {}

    var actions_button = game.add.button(10, 10, 'actions-button', toggleActions)
    actions_button.scale.setTo(0.3, 0.3)
    actions_button.body.immovable = true

    actions_group = game.add.group()
    actions_group.visible = false
    draggable_tools = game.add.group(actions_group)
    draggable_tools.visible = false

    if(mode.isPet){

      var action_poop = game.add.button(10, 60, 'perrito', poopClicked, this, 'icono_popis.png', 'icono_popis.png', 'icono_popis.png', 'icono_popis.png', actions_group)
      function poopClicked(here) {
        here = here || pet
        mode.petRef.child('poops').push({x: here.body.x, y: here.body.y + here.body.height })
      }
      action_poop.scale.setTo(0.5, 0.5)
      makeDraggableTool(action_poop, function(){
        poopClicked(action_poop)
      })

      var action_sleep = game.add.button(10, 110, 'perrito', sleepyClicked, this, 'icono_zzz.png', 'icono_zzz.png', 'icono_zzz.png', 'icono_zzz.png', actions_group)
      action_sleep.scale.setTo(0.5, 0.5)
      action_sleep.body.immovable = true

    } else {

      action_clean = game.add.sprite(10, 60, 'perrito', 'indicador_limpieza.png', actions_group)
      action_clean.scale.setTo(0.5, 0.5)
      makeDraggableTool(action_clean, function(){ })

      var action_feed = game.add.sprite(10, 110, 'perrito', 'platolleno.png', actions_group)
      action_feed.scale.setTo(0.5, 0.5)
      makeDraggableTool(action_feed, function(){
        mode.petRef.child('plates').push({x: action_feed.body.x, y: action_feed.body.y })
      })

      mode.petRef.child('movingTo').on('value', function(movingTo){
        movePetToPointer(movingTo.val())
      })

    }

    mode.petRef.child('energized').on('value', function(snap){
      pet.energized = snap.val()
    })

    mode.petRef.child('poops').on('child_added', function(snap){
      var pos = snap.val()
      var poop = game.add.sprite(pos.x, pos.y, 'perrito', 'icono_popis.png', poops_group)
      poop.scale.setTo(0.2, 0.2)
      poop.anchor.setTo(0.5, 0.5)
      poops_group.named[snap.name()] = poop
      poop.name = snap.name()
    })

    mode.petRef.child('poops').on('child_removed', function(snap){
      var poop = poops_group.named[snap.name()]
      poop.kill()
      delete poops_group.named[snap.name()]
    })

    mode.petRef.child('plates').on('child_added', function(snap){
      var pos = snap.val()
      var plate = game.add.sprite(pos.x, pos.y, 'perrito', 'platolleno.png', plates_group)
      plate.scale.setTo(0.5, 0.5)
      plate.anchor.setTo(0.5, 0.5)
      plates_group.named[snap.name()] = plate
      plate.name = snap.name()

      snap.ref().child("eaten").on("value", function(eaten){
        if(eaten.val()){
          plate.frameName = "platovacio.png"
        }
      })
    })

    mode.petRef.child('plates').on('child_removed', function(snap){
      var plate = plates_group.named[snap.name()]
      plate.kill()
      delete plates_group.named[snap.name()]
    })


  }

  function makeDraggableTool(sprite, dragged){
    draggable_tools.add(sprite)
    var originalPos = {x: sprite.body.x, y: sprite.body.y}
    sprite.body.immovable = true
    sprite.inputEnabled = true
    sprite.input.enableDrag()
    sprite.events.onDragStop.add(function(){
      dragged()
      sprite.movingTo = originalPos
      game.physics.moveToXY(sprite, originalPos.x, originalPos.y, 350, 1000)
    }, this);
  }


  function sleepyClicked() {
    pet.energized = (pet.energized || 1) * 0.931416
    mode.petRef.child('energized').set(pet.energized)
  }

  function toggleActions(){
    actions_group.visible = !actions_group.visible
    draggable_tools.visible = !draggable_tools.visible
  }

  function update(){
    stopMovingPetIfArrived()
    stopMovingToolsIfArrived()
    if(mode.isPet){ 
      triggerPetMovementOnTouch()
      dogEatsPlate()
    } else {
      brushCleans() 
    }
  }

  function brushCleans() {
    game.physics.overlap(action_clean, [poops_group, plates_group], function(brush, dirth){
      if(dirth.name){ 
        mode.petRef.child(dirth.group.name).child(dirth.name).set(null)
      }
    })
  }

  function dogEatsPlate() {
    game.physics.overlap(pet, plates_group, function(pet, plate){
      if(plate.name){ 
        mode.petRef.child('plates').child(plate.name).child("eaten").set(true)
      }
    })
  }


  function stopMovingPetIfArrived(){
    if (hasArrivedThere(pet)) {
      pet.body.reset()
      pet.movingTo = null
      if(mode.isPet){ mode.petRef.update({movingTo: null}) }
    }
  }

  function stopMovingToolsIfArrived(){
    draggable_tools.forEachAlive(function(tool){
      if(hasArrivedThere(tool)) {
        tool.body.reset()
        tool.movingTo = null
      }
    }, this)
  }

  function triggerPetMovementOnTouch(){
    if(game.input.mousePointer.isDown && game.input.mousePointer.targetObject == null){
      movePetToPointer(game.input.mousePointer)
    } else if (game.input.pointer1.isDown && game.input.pointer1.targetObject == null) {
      movePetToPointer(game.input.pointer1)
    }
  }

  function hasArrivedThere(thing) {
    return thing && thing.movingTo && thing.body.speed > 0 &&
    game.physics.distanceToXY(thing, thing.movingTo.x, thing.movingTo.y) < 10
  }

  function movePetToPointer(pointer){
    if(!pointer){ return }
    pet.movingTo = {x: pointer.x, y: pointer.y}
    mode.petRef.update({movingTo: pet.movingTo})
    var speed = (pet.energized || 1)
    game.physics.moveToXY(pet, pointer.x, pointer.y, 100 * speed, 1000 / speed) 
  }

}
