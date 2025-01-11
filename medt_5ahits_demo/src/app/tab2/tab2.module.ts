import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { DominoComponent } from '../components/domino/domino.component';
import { HighmapComponent } from '../components/highmap/highmap.component';
import { Tab1PageModule } from '../tab1/tab1.module';

import { Tab2PageRoutingModule } from './tab2-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab2PageRoutingModule,
    Tab1PageModule
  ],
  declarations: [Tab2Page, DominoComponent]
})
export class Tab2PageModule {}
