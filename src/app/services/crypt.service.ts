import { Injectable } from '@angular/core';
import {AES, enc} from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptService {

  private key = "psu4e23fhWM9";
  constructor() { }

  encrypt(str:string) {
    return AES.encrypt(str, this.key);
  }

  decrypt(str:string) {
    const dec = AES.decrypt(str, this.key).toString(enc.Utf8);
    return dec.split("").reverse().join("");
  }
}
