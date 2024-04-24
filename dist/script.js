(function(window) {
	
	function Fly(camera, onReady) {
    this.onReady = onReady;
		this.mouseX = 0;
		this.mouseY = 0;
		this.camera = camera;
    
		this.el = new THREE.Group();
		this.el.position.z = 10;
		Utils.loadOBJ('https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/butterfly.obj', null, function(object) {
			object.traverse(function(child) {
				if (child.type === 'Mesh') {
          child.material = new THREE.MeshPhongMaterial({color: 0xd45f00, side: THREE.DoubleSide});
				}
			});
			
			this.body = object;
			this.body.scale.set(4, 4, 4)
			this.el.add(this.body);
			
			var wingLeft = this.el.getObjectByName('Wing_Left');
			var wingRight = this.el.getObjectByName('Wing_Right');
			
			// Animation
			TweenMax.to(this.body.position, 0.5, {y: 0.5, yoyo: true, repeat: -1, ease: Quad.easeInOut});
			TweenMax.to(wingLeft.rotation, 0.1, {z: Utils.toRad(-85), repeat: -1, yoyo: true, ease: Linear.easeNone});
			TweenMax.to(wingRight.rotation, 0.1, {z: Utils.toRad(85), repeat: -1, yoyo: true, ease: Linear.easeNone});
      
      this.onReady();
		}.bind(this));
		
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
	}
	
	Fly.prototype.onMouseMove = function(e) {
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		this.moveTo(this.mouseX, this.mouseY);
	}
	
	Fly.prototype.moveTo = function(x, y) {
		var vec3 = Utils.unproject2DCoords(x, y, this.camera, this.el.position.z);
		TweenLite.to(this.el.position, 0.3, {x: vec3.x, y: vec3.y, ease: Linear.easeNone});
	}
	
	window.Fly = Fly;
	
})(window);


(function(window) {
  
	function Watcher(camera, onReady) {
    this.onReady = onReady;
		this.camera = camera;
		this.mouseX = 0;
		this.mouseY = 0;
		this.walkerY = 0;
		this.walkerX = 0;
		this.loaded = false;
		
		var self = this;
		
		this.el = new THREE.Object3D();
		var scale = 1.2;
		this.el.scale.set(scale, scale, scale);
		
		setTimeout(function() {
			var vec3 = Utils.unproject2DCoords(window.innerWidth / 3, window.innerHeight / 3, camera, 5);
			this.el.position.set(vec3.x, vec3.y, 5);
		}.bind(this), 0)

		
		// Load OBJ File with Materials
		Utils.loadOBJ('https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/cam.obj', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/cam.mtl', function(object) {
			var body = new THREE.Object3D(),
					base = new THREE.Object3D(),
					pivot = new THREE.Object3D();
			
			// Apply shadows
			object.traverse( function(child) {
				if ( child instanceof THREE.Mesh ) {
	        child.castShadow = true;
	        child.receiveShadow = true;
		    }
			})
			
      var glass = object.getObjectByName('Glass');
      glass.material = new THREE.MeshPhongMaterial({color: 'black', shininess: 300, reflectivity: 10, opacity: 0.7});
      glass.material.transparent = true;
      
			// Separate parts of the camera into groups
			body.add(object.getObjectByName('lens_body'));
      body.add(object.getObjectByName('Glass'));
			body.add(object.getObjectByName('cam_body'));
			body.add(object.getObjectByName('rotate_node02'));
			body.add(object.getObjectByName('lens01'));
			body.add(object.getObjectByName('rain_cover'));
			base.add(object.getObjectByName('cam_base'));
			pivot.add(object.getObjectByName('Rotate_node_Z'));
			
			self.body = body;
			self.base = base;
			self.pivot = pivot;
			
			self.el.add(body);
			self.el.add(base);
			self.el.add(pivot);
			
			self.loaded = true;
			self.onReady();
		});
		
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
	}
  
  Watcher.prototype.onMouseMove = function(e) {
    this.mouseX = e.clientX;
		this.mouseY = e.clientY;
  
    var vec3 = Utils.unproject2DCoords(this.mouseX, this.mouseY, this.camera, 10).sub(new THREE.Vector3(this.el.position.x - 2, this.el.position.y + 2, 0));
		TweenMax.rotateTo(this.body, 0.1, {vector: vec3, ease: Linear.easeNone, delay: 0.2});
  }

	window.Watcher = Watcher;
})(window);


var wW,
		wH,
		canvas3d,
		canvas2d,
		scene,
		camera,
		renderer,
		watcher,
		lights = [],
		plane,
		fly,
    numObjectsLoaded = 0;
		
function init() {
	canvas3d = document.getElementById('canvas3d');
	setSize();
  $('#intro').css('opacity', '1');
  
	// Set up 3D Canvas
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(40, wW / wH, 0.1, 1000);
	camera.position.z = 30;
	camera.lookAt(scene.position);
	renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true,
    alpha: true
  });
	renderer.setSize(wW, wH);
	renderer.shadowMap.enabled = true;
	
  watcher = new Watcher(camera, checkReady);
	scene.add(watcher.el);
  
	var light = new THREE.SpotLight(0xffffff);
	var vec3 = Utils.unproject2DCoords(window.innerWidth / 3, window.innerHeight / 3, camera, 5);
	light.position.set(vec3.x + 10, vec3.y + 20, 25);
	light.castShadow = true;
	light.shadow.mapSize.width = 4096;
	light.shadow.mapSize.height = 4096;
	light.shadow.camera.near = 1;
	light.shadow.camera.far = 200;
	light.shadow.camera.fov = 45;
	scene.add(light);
	
	var light2 = new THREE.AmbientLight(0xffffff, 0.3);
	scene.add(light2);
	
	var planeG = new THREE.PlaneGeometry(500, 500, 50);
	var planeMat = new THREE.MeshPhongMaterial({color: 0xffde00, side: THREE.DoubleSide});
	plane = new THREE.Mesh(planeG, planeMat);
	plane.receiveShadow = true;
	scene.add(plane);

	fly = new Fly(camera, checkReady);
	scene.add(fly.el);
	
	light.lookAt(watcher.el.position);
	
	render();
}

function setSize() {
	wW = window.innerWidth;
	wH = window.innerHeight;

  $('#intro').css({
    left: (wW / 2) - ($('#intro').width() / 2),
    top: (wH / 2) - ($('#intro').height() / 2)
  })
  
	canvas3d.style.width = wW + 'px';
  canvas3d.style.height = wH + 'px';
}

function checkReady() {
  numObjectsLoaded++;
  console.log(numObjectsLoaded)
  if (numObjectsLoaded >= 2) {
    TweenLite.to('#intro, #bg', 1, {opacity: 0});
  }
}

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

$(document).ready(init);