// import { Wireframe } from "three/examples/jsm/Addons.js";
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import "./style.css"
import { gsap } from 'gsap';
import * as THREE from 'three';

//scene
const scene = new THREE.Scene();

//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.z = 2.5;

//objects
let model;
//add in the scene

//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); //for getting good quality on high resolution devices no lag
renderer.setSize(window.innerWidth, window.innerHeight); //rendering the scene

//controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// controls.dampingFactor = 0.25;
// controls.screenSpacePanning = false;
// controls.maxPolarAngle = Math.PI / 2;

// Load EXR
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new EXRLoader()
  .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/')
  .load('royal_esplanade_1k.exr', function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    // scene.background = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  });

// Load GLTF model
const loader = new GLTFLoader();
loader.load(
  './DamagedHelmet.gltf', // replace with the path to your model
  function (gltf) {
    model =gltf.scene
    scene.add(model);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015; // Adjust the amount of RGB shift
composer.addPass(rgbShiftPass);


//mouse movement
window.addEventListener('mousemove', (e) => {
  if (model) {
    const rotationX = (e.clientX / window.innerWidth - 0.5) * (Math.PI*.3);
    const rotationY = (e.clientY / window.innerHeight - 0.5) * (Math.PI*.3);
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.3,
      ease: "power3.out"
    });
    model.rotation.y = rotationX;
    model.rotation.x = rotationY;
    console.log(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
  }
});


// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; //for updating the camera aspect ratio
  camera.updateProjectionMatrix(); //for updating the camera aspect ratio
  renderer.setSize(window.innerWidth, window.innerHeight); //to setting the size of the renderer
  composer.setSize(window.innerWidth, window.innerHeight); //to setting the size of the composer
}); 

//render
function animate(){
  requestAnimationFrame(animate);
  // controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

  composer.render();
}
animate();
