import { injectable } from "inversify";
import BaseRepository from "./base.repository";
import { Document } from "mongoose";

@injectable()
export default abstract class BaseService<T extends Document> {
    protected repository: BaseRepository<T>;

    constructor(repository: BaseRepository<T>) {
        this.repository = repository;
    }

    async create(data: Partial<T>): Promise<T> {
        return await this.repository.create(data);
    }

    async findById(id: string): Promise<T | null> {
        return await this.repository.findById(id);
    }

    async findAll(): Promise<T[]> {
        return await this.repository.findAll();
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        return await this.repository.update(id, data);
    }

    async delete(id: string): Promise<T | null> {
        return await this.repository.delete(id);
    }
}
