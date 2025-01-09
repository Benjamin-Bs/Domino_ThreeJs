import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PerspectiveCamera, Scene, WebGLRenderer, Mesh, BoxGeometry, AmbientLight, DirectionalLight, MeshStandardMaterial, Box3, Vector3, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


@Component({
  selector: 'app-domino',
  templateUrl: './domino.component.html',
  styleUrls: ['./domino.component.scss'],
})
export class DominoComponent implements OnInit, AfterViewInit {

  @ViewChild('domino') canvas!: ElementRef<HTMLCanvasElement>;

  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  world!: CANNON.World;
  dominoMaterial!: CANNON.Material;
  rigidBodies: { mesh: Mesh; body: CANNON.Body }[] = [];

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.initScene();
    this.initPhysics();
    this.loadModel();
  }

  private initScene(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    const light = new AmbientLight(0xffffff, 0.8); // Umgebungslicht
    this.scene.add(light);

    const directionalLight = new DirectionalLight(0xffffff, 0.8); // Richtungslicht
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    this.camera.position.set(8, 8, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setAnimationLoop(() => {
      controls.update();
      this.animate();
    });
  }

  animate() {
    this.world.step(1 / 60); // Physik-Update

    this.rigidBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position as any); // Position synchronisieren
      mesh.quaternion.copy(body.quaternion as any); // Rotation synchronisieren
    });

    this.renderer.render(this.scene, this.camera);
  }

  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.81, 0); // Schwerkraft

    const solver = new CANNON.GSSolver();
    solver.iterations = 10; // Iterationen festlegen
    solver.tolerance = 0.001; // Toleranz für präzisere Berechnungen
    this.world.solver = solver;

    // Materialien definieren
    const defaultMaterial = new CANNON.Material("default");
    this.dominoMaterial = new CANNON.Material("domino");

    const dominoContactMaterial = new CANNON.ContactMaterial(this.dominoMaterial, this.dominoMaterial, {
      friction: 0.01, // Niedrige Reibung
      restitution: 0.2, // Leichte Elastizität
    });

    this.world.addContactMaterial(dominoContactMaterial);
    this.addGround(defaultMaterial);
  }

  addGround(material: CANNON.Material) {
    if (!this.scene) {
      console.error('Scene is not initialized');
      return;
    }

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      material: material,
    });

    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Ebene horizontal drehen
    groundBody.position.set(0, -1, 0);
    this.world.addBody(groundBody);

    const groundMesh = new Mesh(
      new BoxGeometry(50, 1, 50),
      new MeshStandardMaterial({ color: 0x808080 })
    );

    groundMesh.receiveShadow = true;
    groundMesh.position.set(0, -3, 0);
    this.scene.add(groundMesh);
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'assets/Blender/domino.gltf',
      (gltf) => {
        const dominoScene = gltf.scene;

        const tectureLoader = new TextureLoader();
        const normalMap = tectureLoader.load('assets/domino_normalMap.png');

        dominoScene.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = new MeshStandardMaterial({
              color: 0xffffff,
              normalMap: normalMap,
              roughness: 0.5,
              metalness: 0.1,
            });

            child.castShadow = true;
            child.receiveShadow = true;

            this.addPhysicsToModel(child);
          }
        });

        this.scene.add(dominoScene);
        this.camera.lookAt(0, 0, 0);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }

  addPhysicsToModel(domino: Mesh, isFirst: boolean = false) {
    // Berechnung der Größe des Steines
    const boundingBox = new Box3().setFromObject(domino);
    const size = new CANNON.Vec3(
      (boundingBox.max.x - boundingBox.min.x) / 2,
      (boundingBox.max.y - boundingBox.min.y) / 2,
      (boundingBox.max.z - boundingBox.min.z) / 2
    );

    const shape = new CANNON.Box(size);
    const body = new CANNON.Body({
      mass: 0.5,
      position: new CANNON.Vec3(domino.position.x, domino.position.y, domino.position.z),
      material: this.dominoMaterial,
    });

    body.addShape(shape);
    body.linearDamping = 0.01;
    body.angularDamping = 0.01;

    if (isFirst) {
      body.velocity.set(0, 0, -2);
    }

    this.world.addBody(body);
    this.rigidBodies.push({ mesh: domino, body });
  }

  startDominoFall() {
    if (this.rigidBodies.length > 0) {
      const firstDomino = this.rigidBodies[0].body;
      firstDomino.applyImpulse(new CANNON.Vec3(-5, 0, 0), new CANNON.Vec3(0, 1, 0));
    }
  }
}
