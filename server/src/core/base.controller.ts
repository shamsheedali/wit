import { Request, Response } from 'express';
import BaseService from './base.service';
import { Document } from 'mongoose';
import HttpStatus from '../constants/httpStatus';

export default abstract class BaseController<T extends Document> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await this.service.create(req.body);
      return res.status(HttpStatus.CREATED).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error creating resource', error });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await this.service.findAll();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error fetching resources', error });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = await this.service.findById(id);
      if (!data) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Resource not found' });
      }
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error fetching resource', error });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = await this.service.update(id, req.body);
      if (!data) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Resource not found' });
      }
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error updating resource', error });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = await this.service.delete(id);
      if (!data) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Resource not found' });
      }
      return res.status(HttpStatus.OK).json({ message: 'Resource deleted successfully' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error deleting resource', error });
    }
  }
}
