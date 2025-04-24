import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { ITournament } from '../models/tournament.model';
import TYPES from '../../config/types';

@injectable()
export default class TournamentRepository extends BaseRepository<ITournament> {
  constructor(@inject(TYPES.TournamentModel) tournamentModel: Model<ITournament>) {
    super(tournamentModel);
  }

  async addPlayer(tournamentId: string, userId: string): Promise<ITournament | null> {
    return this.model
      .findByIdAndUpdate(
        tournamentId,
        {
          $addToSet: {
            players: {
              userId: new Types.ObjectId(userId),
              points: 0,
              gamesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
            },
          },
        },
        { new: true }
      )
      .populate('players.userId', 'username')
      .populate({ path: 'createdBy', select: 'username', model: 'Users', strictPopulate: false })
      .exec();
  }

  async removePlayer(tournamentId: string, userId: string): Promise<ITournament | null> {
    return this.model
      .findByIdAndUpdate(
        tournamentId,
        {
          $pull: {
            players: { userId: new Types.ObjectId(userId) },
          },
        },
        { new: true }
      )
      .populate('players.userId', 'username')
      .populate({ path: 'createdBy', select: 'username', model: 'Users', strictPopulate: false })
      .populate('matches.player1Id', 'username')
      .populate('matches.player2Id', 'username')
      .populate('playoffMatch.player1Id', 'username')
      .populate('playoffMatch.player2Id', 'username')
      .exec();
  }

  async delete(tournamentId: string): Promise<ITournament | null> {
    return this.model.findByIdAndDelete(tournamentId).exec();
  }

  async findByUserId(userId: string): Promise<ITournament[]> {
    return this.model
      .find({ 'players.userId': new Types.ObjectId(userId) })
      .populate('players.userId', 'username')
      .populate({ path: 'createdBy', select: 'username', model: 'Users', strictPopulate: false })
      .exec();
  }

  async createMatch(
    tournamentId: string,
    player1Id: string,
    player2Id: string
  ): Promise<ITournament | null> {
    return this.model
      .findByIdAndUpdate(
        tournamentId,
        {
          $push: {
            matches: {
              player1Id: new Types.ObjectId(player1Id),
              player2Id: new Types.ObjectId(player2Id),
            },
          },
        },
        { new: true }
      )
      .populate('players.userId', 'username')
      .populate('matches.player1Id', 'username')
      .populate('matches.player2Id', 'username')
      .exec();
  }

  async countDocuments(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async findById(id: string): Promise<ITournament | null> {
    return this.model
      .findById(id)
      .populate({
        path: 'players.userId',
        select: 'username',
        model: 'Users',
      })
      .populate({
        path: 'createdBy',
        select: 'username',
        model: 'Users',
        strictPopulate: false,
      })
      .populate({
        path: 'matches.player1Id',
        select: 'username',
        model: 'Users',
      })
      .populate({
        path: 'matches.player2Id',
        select: 'username',
        model: 'Users',
      })
      .populate({
        path: 'playoffMatch.player1Id',
        select: 'username',
        model: 'Users',
      })
      .populate({
        path: 'playoffMatch.player2Id',
        select: 'username',
        model: 'Users',
      })
      .exec();
  }

  async findByIdWithPopulation(id: string): Promise<ITournament | null> {
    const tournament = await this.model
      .findById(id)
      .populate({
        path: 'players.userId',
        select: 'username',
        model: 'Users',
      })
      .populate({
        path: 'createdBy',
        select: 'username',
        model: 'Users',
        strictPopulate: false,
      })
      .exec();
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    return tournament;
  }
}
