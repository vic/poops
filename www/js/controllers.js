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

.controller('GameCtrl', function($scope, $stateParams){


  var game = new Phaser.Game(478, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update })
  var dog

  function preload() {
    game.load.atlasJSONHash('perrito', 'img/perrito.png', 'img/perrito.json');
  }

  function create() {
    dog = game.add.sprite(game.world.centerX, game.world.centerY, 'perrito', 'cola1.png')
    dog.scale.setTo(0.4, 0.4)
    dog.anchor.setTo(0.5, 0.5)
    dog.animations.add('colita', ['cola1.png', 'cola2.png', 'cola3.png'], 3, true, false)
    dog.animations.play('colita')
  }

  function update(){
    updateDogMovement()
  }

  function updateDogMovement(){
    if(game.input.mousePointer.isDown){
      moveDogToPointer(game.input.mousePointer)
    } else if (game.input.pointer1.isDown) {
      moveDogToPointer(game.input.pointer1)
    } else if (dogArrivedThere()) {
      dog.body.reset()
      dog.movingTo = null
    }
  }

  function dogArrivedThere(){
    return dog.movingTo && dog.body.speed > 0 &&
    game.physics.distanceToXY(dog, dog.movingTo.x, dog.movingTo.y) < 10
  }

  function moveDogToPointer(pointer){
    dog.movingTo = {x: pointer.x, y: pointer.y}
    game.physics.moveToXY(dog, pointer.x, pointer.y, 100, 1000) 
  }


})
