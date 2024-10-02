import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ListDoc extends BaseDoc {
  author: ObjectId;
  allowed: string[];
}

/**
 * concept: Posting [Author]
 */
export default class PostingConcept {
  public readonly posts: DocCollection<ListDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.posts = new DocCollection<ListDoc>(collectionName);
  }

  async create(author: ObjectId, allowed: string[]) {
    const _id = await this.posts.createOne({ author, allowed});
    return { msg: "Whitelist successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getByAuthor(author: ObjectId) {
    return await this.posts.readMany({ author });
  }

  async update(_id: ObjectId, allowed?: string[]) {
    // Note that if allowed or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    await this.posts.partialUpdateOne({ _id }, { allowed });
    return { msg: "Whitelist successfully updated!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Whitelist ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new ListAuthorNotMatchError(user, _id);
    }
  }
}

export class ListAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of list {1}!", author, _id);
  }
}
