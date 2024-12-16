import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PerspectiveCamera, Scene, WebGLRenderer, Mesh, Clock, MeshBasicMaterial, BoxGeometry, AmbientLight, MeshStandardMaterial, DirectionalLight, PointLight, TextureLoader } from 'three';
import { HighmapComponent } from '../highmap/highmap.component';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-threejs-demo',
  templateUrl: './threejs-demo.component.html',
  styleUrls: ['./threejs-demo.component.scss'],
})
export class ThreejsDemoComponent implements OnInit, AfterViewInit {

  @ViewChild('threejs') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(HighmapComponent) heightmapComponent!: HighmapComponent;

  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  clock = new Clock();
  rotationSpeed: number = 0;
  cube!: Mesh;
  terrain!: Mesh;
  shadowCube!: Mesh;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.initScene();
    this.heightmapComponent.loadHeightmap('assets/heightmap.png'); // Load heightmap
  }

  private initScene(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // Add a rotating cube
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0x9932CC });
    this.cube = new Mesh(geometry, material);

    this.scene.add(this.cube);

    const textureLoader = new TextureLoader();
    const normalMap = textureLoader.load('assets/NormalMap.png');


    // Add Shadow cube
    const shadowGeometry = new BoxGeometry(1, 1, 1,);
    const shadowMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      normalMap: normalMap
    });

    this.shadowCube = new Mesh(shadowGeometry, shadowMaterial);
    this.scene.add(this.shadowCube);

    this.shadowCube.position.set(1, 10, 1);

    // Shadow cube lighting
    this.shadowCube.castShadow = true;

    this.camera.position.set(30, 20, 0);
    this.camera.lookAt(0, 0, 0);

    // Start rendering loop
    this.renderer.setAnimationLoop(() => {
      controls.update(); //Für die OrbitControls
      this.animate();
    });

    this.cube.receiveShadow = true;
    this.cube.castShadow = true;

    // Ambient Light
    const light = new AmbientLight(0xFFFFFF, 0.1);
    this.scene.add(light);

    // diffuse Light
    const directinalLight = new DirectionalLight(0xFFFFFF);
    directinalLight.position.set(-20, 20, 5);
    //directinalLight.position.set(1, 80, 1);
    directinalLight.castShadow = true; // Activate Shadow
    // Shadow Map vergrößern
    directinalLight.shadow.mapSize.width = 2048;
    directinalLight.shadow.mapSize.height = 2048;

    this.scene.add(directinalLight);


    // point light
    const pointLight = new PointLight(0xffffff, 100, 500, 1);
    pointLight.position.set(1, 20, 1);
    pointLight.castShadow = true;
    this.scene.add(pointLight);

    // OrbitControls 
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true; //Für weiche Übergänge
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2; // Beschränkt vertikales Drehen (optional)
    controls.minDistance = 10; // Minimaler Abstand zur Szene
    controls.maxDistance = 100; // Maximaler Abstand zur Szene

  }

  // Receives terrain mesh from HeightmapComponent
  onTerrainCreated(terrain: Mesh) {
    this.terrain = terrain;
    this.terrain.receiveShadow = true; // Schatten empfangen
    // this.terrain.castShadow = false; //Selber keinen Schatten werfen
    this.scene.add(this.terrain); // Add terrain to the scene
  }

  // Method to animate cube and render scene
  animate() {
    const elapsed = this.clock.getDelta();
    this.cube.rotation.x += this.rotationSpeed * elapsed * 0.1;
    this.cube.rotation.y += this.rotationSpeed * elapsed * 0.1;

    if (this.terrain) {
      this.terrain.rotation.y += this.rotationSpeed * elapsed * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onRotationSpeedChanged(ev: Event) {
    const rangeEvent = ev as CustomEvent;
    this.rotationSpeed = rangeEvent.detail.value as number;
  }
}
