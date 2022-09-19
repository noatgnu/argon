import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment"

@Injectable({
  providedIn: 'root'
})
export class WebService {
  hostURL = environment.host
  constructor(private http: HttpClient) { }

  submitData(data: string) {
    return this.http.post(this.hostURL + "/api/configuration", data, {responseType: "json", observe: "body"})
  }
}
