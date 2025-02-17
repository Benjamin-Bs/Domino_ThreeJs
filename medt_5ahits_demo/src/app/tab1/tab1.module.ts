import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { ThreejsDemoComponent } from '../components/threejs-demo/threejs-demo.component';
import { HighmapComponent } from '../components/highmap/highmap.component';

import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
  ],
  declarations: [Tab1Page, ThreejsDemoComponent, HighmapComponent],
  exports: [HighmapComponent]
})
export class Tab1PageModule {}
