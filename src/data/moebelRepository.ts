import type { Moebel } from "../models/types";
import katalog from "./moebel.json";

// Zugriff nur über dieses Interface, damit später eine Cloud-Datenbank
// (Supabase) angeschlossen werden kann, ohne die Views zu ändern.
export interface MoebelRepository {
  alle(): Promise<Moebel[]>;
}

export class LokalesMoebelRepository implements MoebelRepository {
  async alle(): Promise<Moebel[]> {
    return katalog as Moebel[];
  }
}
