import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContainerComponent } from './container/container.component';
import { RadialLinear } from './radial-linear/kh-radial-linear';
import { ScrollTestComponent } from './scroll-test/scroll-test.component';

const routes: Routes = [
  { path: ':id', component: ContainerComponent },
  { path: '', component: ScrollTestComponent },
  { path: 'scroll', component: ScrollTestComponent },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
