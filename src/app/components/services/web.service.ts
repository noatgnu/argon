import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../../environments/environment"
import {Observable} from "rxjs";
import {LinkData} from "../../classes/interaces/link-data";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  hostURL = environment.host
  constructor(private http: HttpClient) { }

  submitData(data: string) {
    let headers = new HttpHeaders()
    headers = headers.set("Accept", "application/json")
    return this.http.post(this.hostURL + "/api/configuration", data, {responseType: "json", observe: "response", headers})
  }

  getLinkData(linkID: string): Observable<LinkData[]> {
    let headers = new HttpHeaders()
    headers = headers.set("Accept", "application/json")
    return this.http.get<LinkData[]>(this.hostURL + "/api/link/flow/" + linkID, {responseType: "json", observe: "body", headers})
  }
}
