import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TstDotConnectComponent } from './tst-dot-connect/tst-dot-connect.component';
import { ContainerComponent } from './container/container.component';
import { SpotlightComponent } from './spotlight/spotlight.component';
import { TestcomponentComponent } from './testcomponent/testcomponent.component';
import { RadialLinearComponent } from './radial-linear/radial-linear.component';
import { ScrollTestComponent } from './scroll-test/scroll-test.component';

@NgModule({
  declarations: [
    AppComponent,
    TstDotConnectComponent,
    ContainerComponent,
    SpotlightComponent,
    TestcomponentComponent,
    RadialLinearComponent,
    ScrollTestComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
