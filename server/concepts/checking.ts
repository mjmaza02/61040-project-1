import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

import google from "@victorsouzaleal/googlethis";
import * as fs from 'node:fs/promises';

export interface CheckingDoc extends BaseDoc {
  owner: ObjectId;
  images: string[];
}

/**
 * concept: Checking [owner]
 */
export default class CheckingConcept {
  public readonly chks: DocCollection<CheckingDoc>;

  /**
   * Make an instance of Checking.
   */
  constructor(collectionName: string) {
    this.chks = new DocCollection<CheckingDoc>(collectionName);
  }

  async create(owner: ObjectId) {
    const _id = await this.chks.createOne({ owner });
    return { msg: "Check successfully created!", check: await this.chks.readOne({ _id }) };
  }

  async getByOwner(owner: ObjectId) {
    return await this.chks.readOne({ owner });
  }

  async update(_id: ObjectId, images?: string[]) {
    // Note that if content or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    await this.chks.partialUpdateOne({ _id }, { images });
    return { msg: "Check successfully updated!" };
  }

  async delete(_id: ObjectId, user: ObjectId) {
    await this.assertOwnerIsUser(_id, user);
    await this.chks.deleteOne({ _id });
    return { msg: "Check deleted successfully!" };
  }

  async assertOwnerIsUser(_id: ObjectId, user: ObjectId) {
    const check = await this.chks.readOne({ _id });
    if (!check) {
      throw new NotFoundError(`Check ${_id} does not exist!`);
    }
    if (check.owner.toString() !== user.toString()) {
      throw new CheckOwnerNotMatchError(user, _id);
    }
  }

  async check(_id: ObjectId) {
    const check = await this.chks.readOne({ _id });
    let matches = new Array<JSON>;
    if (!check) {
      throw new NotFoundError(`Check ${_id} does not exist!`);
    }
    for (let src of check.images) {
      const imBuffer = await this.download(src);
      const search = await google.search(imBuffer, { ris: true });
      console.log(typeof (search.results));
    }
  }
  async tCheck(src: string) {
    const imBuffer = await this.download(src);
    console.log(imBuffer.body);
    const search = await google.search(imBuffer, { ris: true });
    console.log("2");

    console.log(typeof (search.results));
    // return { msg: "RESULTS", list:search.results};
    return {msg: imBuffer}
  }

  private async download(src: string) {
    const im = await fetch(src + "&alt=media");
    if (!im) {
      throw new NotFoundError("im not found");
    }
    const imArr = await im.arrayBuffer()
    return im;
  }
}

export class CheckOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of {1}!", owner, _id);
  }
}
