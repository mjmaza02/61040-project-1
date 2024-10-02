import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TrackingDoc extends BaseDoc {
  target: string;
  counter: number;
}

/**
 * concept: Posting [Author]
 */
export default class TrackingConcept {
  public readonly track: DocCollection<TrackingDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.track = new DocCollection<TrackingDoc>(collectionName);
  }

  async create(target: string, counter: number) {
    const _id = await this.track.createOne({ target, counter });
    return { msg: "Tracker successfully created!", post: await this.track.readOne({ _id }) };
  }

  async getByTarget(target: string) {
    return await this.track.readMany({ target });
  }

  async update(_id: ObjectId, counter?: number) {
    // Note that if counter or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    await this.track.partialUpdateOne({ _id }, { counter });
    return { msg: "Tracker successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.track.deleteOne({ _id });
    return { msg: "Tracker deleted successfully!" };
  }
}
