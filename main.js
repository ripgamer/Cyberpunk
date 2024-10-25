import { Wireframe } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import "./style.css"
import * as THREE from 'three';

//scene
const scene = new THREE.Scene();

//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.z = 2.5;

//objects
const geometry = new THREE.BoxGeometry(2,2,2);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});

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
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

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
    scene.add(gltf.scene);
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

//render
function animate(){
  requestAnimationFrame(animate);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

  composer.render();
}
animate();
