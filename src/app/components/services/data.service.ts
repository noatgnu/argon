import { Injectable } from '@angular/core';
import {WebService} from "./web.service";
import {TimeSeriesData} from "../../classes/time-series-data";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  linkSubject: any = {}
  enabledLink: string[] = []
  linkWatcher: number = 0
  constructor(private web: WebService) { }

  startWatchingLinks(linkIDs: string[], interval: number = 5000) {
    this.linkWatcher = setInterval(() => {
      this.web.getLinkData(linkIDs.join(";")).subscribe((data) => {
        data.map(d => {
          d.date = new Date(d.date)
        })
        for (const i of data) {
          this.linkSubject[i.linkID].next(new TimeSeriesData(i.data, i.date.getTime()))
        }
      })
    }, interval)
  }

  stopWatchingLinks() {
    clearInterval(this.linkWatcher)
  }


}


