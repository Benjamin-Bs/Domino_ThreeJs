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

    // Licht hinzufügen
    const light = new AmbientLight(0xffffff, 0.8); // Umgebungslicht
    this.scene.add(light);

    const directionalLight = new DirectionalLight(0xffffff, 0.8); // Richtungslicht
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // OrbitControls
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Kamera-Position
    this.camera.position.set(8, 8, 15);
    this.camera.lookAt(0, 0, 0);

    // Animation Loop
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
    this.world.gravity.set(0, -9.8, 0); // Schwerkraft

    const defaultMaterial = new CANNON.Material();
    const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.5,  // Höhere Reibung für Stabilität
      restitution: 0.2, // Weniger "Springen"
    });
    this.world.addContactMaterial(contactMaterial);

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

    groundMesh.position.set(0, -3, 0);
    this.scene.add(groundMesh);

  }


  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'assets/Blender/domino_stone.gltf',
      (gltf) => {
        const domino = gltf.scene.children[0] as Mesh; // Erster Stein
        domino.castShadow = true;
        domino.receiveShadow = true;

        // Lade die Normal Map
        const textureLoader = new TextureLoader();
        const normalMap = textureLoader.load('assets/domino_normalMap.png');

        // Überprüfen, ob das Material ein MeshStandardMaterial ist
        if (domino.material instanceof MeshStandardMaterial) {
          domino.material.normalMap = normalMap;
        } else {
          // Falls das Material nicht MeshStandardMaterial ist, setze es auf ein geeignetes Material
          const newMaterial = new MeshStandardMaterial({
            color: '#000000', // Falls du die Farbe beibehalten willst
            normalMap: normalMap,   // Normal Map zuweisen
          });

          domino.material = newMaterial; // Material des Steins ersetzen
        }

        // Berechnung des dynamischen Abstands basierend auf der Größe des Modells
        const box = new Box3().setFromObject(domino); // Bounding Box des Modells
        const size = box.getSize(new Vector3());
        const offset = size.x * 2; // Abstand etwas größer als die Breite des Steins

        for (let i = 0; i < 10; i++) {
          const clone = domino.clone() as Mesh;

          // Dynamische Positionierung der Steine
          clone.position.set(i * offset, 0.2, 0); // Berechneter Abstand
          clone.rotation.y = Math.PI / 2; // Steine aufrecht stellen

          this.scene.add(clone);
          this.addPhysicsToModel(clone);
        }

        // Kamera auf die mittleren Steine ausrichten
        this.camera.lookAt(5, 0.5, 0);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading model:', error);
      });

  }



  addPhysicsToModel(domino: Mesh) {
    const halfExtents = new CANNON.Vec3(0.5, 0.25, 0.1); // Collider-Größe (anpassen falls nötig)
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({
      mass: 1, // Beweglich
      position: new CANNON.Vec3(domino.position.x, domino.position.y, domino.position.z),
      material: new CANNON.Material(),
    });
    body.addShape(shape);

    this.world.addBody(body);
    this.rigidBodies.push({ mesh: domino, body });
  }

  applyInitialImpulse() {
    if (this.rigidBodies.length > 0) {
      const firstDomino = this.rigidBodies[0].body;
      firstDomino.applyImpulse(new CANNON.Vec3(2, 0, 0), new CANNON.Vec3(0, 1, 0));
    }
  }

}
