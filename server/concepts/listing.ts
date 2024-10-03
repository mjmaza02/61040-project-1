import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ListDoc extends BaseDoc {
  owner: ObjectId;
  list: string[];
}

/**
 * concept: Listing [Owner]
 */
export default class ListingConcept {
  public readonly lists: DocCollection<ListDoc>;

  /**
   * Make an instance of Listing.
   */
  constructor(collectionName: string) {
    this.lists = new DocCollection<ListDoc>(collectionName);
  }
  /**
   * Creates a singular list
   * @param owner 
   * @param list 
   * @returns 
   */
  async create(owner: ObjectId, list: string[]) {
    const _id = await this.lists.createOne({ owner, list});
    return { msg: "List successfully created!", post: await this.lists.readOne({ _id }) };
  }
  /**
   * Deletes a singular list
   * @param _id 
   * @param user 
   * @returns 
   */
  async delete(_id: ObjectId, user: ObjectId){
    this.assertOwnerIsUser(_id, user);
    this.lists.deleteOne({ _id });
    return { msg: "Deleted List successfully!" };
  }

  /**
   * Gets list by it's owner
   * @param owner 
   * @returns {ListDoc} list associated with the owner
   */
  async getByOwner(owner: ObjectId) {
    return await this.lists.readOne({ owner });
  }

  /**
   * Gets list by it's owner, but only the list values
   * @param owner 
   * @returns message with list
   */
  async getList(owner: ObjectId) {
    const list = await this.lists.readOne({ owner });
    return { msg: `List`, list: list?.list}
  }

  /**
   * Adds a new location to a list
   * @param _id list to add entry to
   * @param entry value to add to list
   * @throws {NotFoundError} if list does not exist
   * @returns message confirming success
   */
  async add(_id: ObjectId, entry: string) {
    const list = await this.lists.readOne({_id});
    if (!list){
      throw new NotFoundError(`List ${_id} does not exist!`);
    }
    const newList = list.list;
    newList.push(entry)
    await this.lists.partialUpdateOne({ _id }, { list:newList });
    return { msg: `Added ${entry} to List successfully!`, list:newList };
  }

  /**
   * Removes a location from a list
   * @param _id list to remove entry from
   * @param entry value to remove from list
   * @throws {NotFoundError} if list does not exist
   * @returns message confirming success
   */
  async remove(_id: ObjectId, entry: string) {
    const list = await this.lists.readOne({_id});
    if (!list){
      throw new NotFoundError(`List ${_id} does not exist!`);
    }
    const newList = list.list.filter(s=>s!==entry);
    await this.lists.partialUpdateOne({ _id }, { list:newList });
    return { msg: `Removed ${entry} from List successfully!`, list:newList };
  }

  async assertOwnerIsUser(_id: ObjectId, user: ObjectId) {
    const post = await this.lists.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`List ${_id} does not exist!`);
    }
    if (post.owner.toString() !== user.toString()) {
      throw new ListownerNotMatchError(user, _id);
    }
  }
}

export class ListownerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of list {1}!", owner, _id);
  }
}
