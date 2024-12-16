import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Texture, TextureLoader, BufferGeometry, Mesh, BufferAttribute, MeshBasicMaterial, Scene, MeshBasicMaterialParameters, MeshStandardMaterial, MeshPhysicalMaterial } from 'three';

@Component({
  selector: 'app-highmap',
  templateUrl: './highmap.component.html',
  styleUrls: ['./highmap.component.scss'],
})
export class HighmapComponent {

  @Output() terrainCreated = new EventEmitter<Mesh>();

  constructor() { }

  // Method to load and process the heightmap texture
  loadHeightmap(url: string): void {
    const loader = new TextureLoader();
    loader.load(url, (texture: Texture) => this.onTextureLoaded(texture));
  }

  private onTextureLoaded(texture: Texture) {
    console.log('Heightmap texture loaded');
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    const terrainMesh = this.generateTerrain(data);
    this.terrainCreated.emit(terrainMesh);  // Emit the terrain mesh to parent component
  }

  private generateTerrain(imageData: ImageData): Mesh {
    // Color ranges for different heights
    const colorInfos = [
      [0.2, 0.4, 0.8], // Deep blue for lower areas 
      [0.4, 0.7, 0.2], // Green for mid-height 
      [0.6, 0.5, 0.3]  // Brown for higher areas 
    ];

    const vertices = [];
    const colors = [];

    // Generate vertices and colors based on heightmap data
    for (let z = 0; z < imageData.height; z++) {
      for (let x = 0; x < imageData.width; x++) {    
        const index = (x + z * imageData.width) * 4; // RGBA index
        const y = imageData.data[index] / 255;       // Normalized height value (0-1)

        vertices.push(x - imageData.width / 2, y * 5, z - imageData.height / 2);

        // Assign colors based on height value
        if (y <= 0.5) {
          colors.push(...colorInfos[0], 1); // Blue 
        } else if (y > 0.5 && y <= 0.8) {
          colors.push(...colorInfos[1], 1); // Green
        } else {
          colors.push(...colorInfos[2], 1); // Brown
        }
      }
    }

    // Create indices for terrain mesh
    const indices = [];
    for (let row = 0; row < imageData.height - 1; row++) {
      for (let col = 0; col < imageData.width - 1; col++) {
        const topLeft = row * imageData.width + col;
        const bottomLeft = topLeft + imageData.width;

        // Create two triangles for each cell
        indices.push(topLeft, bottomLeft, topLeft + 1);
        indices.push(topLeft + 1, bottomLeft, bottomLeft + 1);
      }
    }

    // Create terrain geometry and material
    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));  // XYZ
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 4));     // RGBA

    geometry.computeVertexNormals();

    const material = new MeshPhysicalMaterial({
      vertexColors: true,
      wireframe: false, // fill the terrain
      flatShading: true // diffus ligthing
    });

    return new Mesh(geometry, material);
  }
}
