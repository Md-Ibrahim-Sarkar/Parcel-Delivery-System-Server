import { Query } from "mongoose";
import { excludeFields } from "../constants";




export class QueryBuilder<T> {
  public queryModal: Query<T[], T>
  public readonly query: Record<string, string>

  constructor(queryModal: Query<T[], T>, query: Record<string, string>) {
    this.queryModal = queryModal;
    this.query  = query
  }

  filter() {
    const queryObj = { ...this.query };
    excludeFields.forEach(field => delete queryObj[field]);
    this.queryModal = this.queryModal.find(queryObj)

    return this

  }

  paginate() {
    const page = parseInt(this.query.page || '1');
    const limit = parseInt(this.query.limit || '8');
    const skip = (page - 1) * limit;


    this.queryModal = this.queryModal.skip(skip).limit(limit);
    return this
  }
  build() {
    return this.queryModal;
  }

  async getMeta() {
    const totalDocuments = await this.queryModal.model.countDocuments({
      role: { $ne: 'ADMIN' },
    });
    const page = parseInt(this.query.page || '1')
    const limit = parseInt(this.query.limit || '8');
    const totalPage = Math.ceil(totalDocuments / limit);


    return {page, limit, totalPage, totalDocuments}
  }

}