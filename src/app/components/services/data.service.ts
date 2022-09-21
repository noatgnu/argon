import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  linkSubject: any = {}
  enabledLink: string[] = []
  constructor() { }
}
