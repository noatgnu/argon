import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { WorkFlowComponent } from './components/work-flow/work-flow.component';
import {GojsAngularModule} from "gojs-angular";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TestComponent } from './components/test/test.component';
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    AppComponent,
    WorkFlowComponent,
    NavBarComponent,
    DashboardComponent,
    TestComponent
  ],
    imports: [
        BrowserModule,
        GojsAngularModule,
        NgbModule,
      HttpClientModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
