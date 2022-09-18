import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationServiceService {
  animations: any = {}
  constructor() { }

  addAnimations(key: string, value: go.Animation) {
    this.animations[key] = value
  }
}
