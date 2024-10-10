import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

import google from "@victorsouzaleal/googlethis";

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
    const _id = await this.chks.createOne({ owner, images:[] });
    return { msg: "Check successfully created!", check: await this.chks.readOne({ _id }) };
  }

  async getByOwner(owner: ObjectId) {
    return await this.chks.readOne({ owner });
  }

  async update(_id: ObjectId, image?: string) {
    // Note that if content or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    let chk = await this.chks.readOne({ _id });
    if (chk) {
      if (image) chk.images.push(image);
      await this.chks.partialUpdateOne({ _id }, { images: chk.images });
    }
    return { msg: "Check successfully updated!" };
  }

  async remove(_id: ObjectId, image: string) {
    const chk = await this.chks.readOne({_id});
    if (!chk){
      throw new NotFoundError(`List ${_id} does not exist!`);
    }
    const newChecks = chk.images.filter(s=>s!==image);
    await this.chks.partialUpdateOne({ _id }, { images:newChecks });
    return { msg: `Removed ${image} from List successfully!`, list:newChecks };
  }

  async swap(_id: ObjectId, old_image: string, new_image: string) {
    await this.remove(_id, old_image);
    await this.update(_id, new_image);
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
    const imData = await this.download(src);
    const search = await google.search(imData, { ris: true });
  }

  private async download(src: string) {
    const finalUrl = this.parseUrl(src);
    console.log(finalUrl);
    return await this.readUrlData(finalUrl);
  }

  private async readUrlData(url: string) {
    const response = await fetch(url);
    if (!response.body) throw new NotFoundError("URL INVALID");

    const reader = response.body.getReader();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Do something with last chunk of data then exit reader
        console.log("OUT");
        return data;
      }
      // Otherwise do something here to process current chunk
      value.forEach(e => {
        data += e.toString(16);
      });
    }
  }

  private parseUrl(src: string) {
    const re = /\/(\w+)\//gm
    const parsed_src = src.match(re);
    let fileId = '';
    if (parsed_src && parsed_src.length == 2) {
      fileId = parsed_src[1].slice(1,-1);
    }
    return "https://drive.usercontent.google.com/download?id=" + fileId;
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
