import { inject, injectable } from 'inversify';
import { Model, Types } from 'mongoose';
import TYPES from '../../config/types';
import TournamentRepository from '../repositories/tournament.repository';
import UserRepository from '../repositories/user.repository';
import AdminRepository from '../repositories/admin.repository';
import { ITournament, Match } from '../models/tournament.model';
import { GameType } from '../models/game.model';
import * as bcrypt from 'bcrypt';
import { BadRequestError, NotFoundError } from '../../utils/http-error.util';

@injectable()
export default class TournamentService {
  private _tournamentRepository: TournamentRepository;
  private _userRepository: UserRepository;
  private _adminRepository: AdminRepository;
  private _tournamentModel: Model<ITournament>;

  constructor(
    @inject(TYPES.TournamentRepository) tournamentRepository: TournamentRepository,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.AdminRepository) adminRepository: AdminRepository,
    @inject(TYPES.TournamentModel) tournamentModel: Model<ITournament>
  ) {
    this._tournamentRepository = tournamentRepository;
    this._userRepository = userRepository;
    this._adminRepository = adminRepository;
    this._tournamentModel = tournamentModel;
  }

  async createTournament(
    name: string,
    gameType: GameType,
    timeControl: string,
    maxGames: number,
    createdBy: string,
    maxPlayers: number,
    password?: string,
    createdByAdmin = false
  ): Promise<ITournament> {
    let creator;
    if (createdByAdmin) {
      creator = await this._adminRepository.findById(createdBy);
      if (!creator) throw new NotFoundError('Admin');
    } else {
      creator = await this._userRepository.findById(createdBy);
      if (!creator) throw new NotFoundError('User');
    }

    if (maxPlayers < 2 || maxPlayers > 20) {
      throw new BadRequestError('Max players must be between 2 and 20');
    }

    const tournamentData: Partial<ITournament> = {
      name,
      type: 'league',
      gameType,
      timeControl,
      maxGames,
      maxPlayers,
      createdBy: new Types.ObjectId(createdBy),
      createdByAdmin,
      players: [],
      matches: [],
    };

    if (password && !createdByAdmin) {
      if (password.length !== 6) {
        throw new BadRequestError('Password must be exactly 6 characters');
      }
      tournamentData.password = await bcrypt.hash(password, 10);
    }

    const tournament = await this._tournamentRepository.create(tournamentData);
    if (!createdByAdmin) {
      await this._tournamentRepository.addPlayer(tournament._id.toString(), createdBy);
    }
    return tournament;
  }

  async deleteTournament(tournamentId: string, userId?: string): Promise<ITournament | null> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.createdByAdmin)
      throw new BadRequestError('Cannot delete admin-created tournament');
    if (!tournament.createdBy || !tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new BadRequestError('Only the creator can delete the tournament');
    }
    if (tournament.status === 'active' || tournament.status === 'playoff') {
      throw new BadRequestError('Cannot delete tournament in active or playoff status');
    }
    const deletedTournament = await this._tournamentRepository.delete(tournamentId);
    return deletedTournament;
  }

  async deleteTournamentAdmin(tournamentId: string): Promise<ITournament | null> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    // if (tournament.createdByAdmin)
    //   throw new BadRequestError('Cannot delete admin-created tournament');
    // if (!tournament.createdBy || !tournament.createdBy.equals(new Types.ObjectId(userId))) {
    //   throw new BadRequestError('Only the creator can delete the tournament');
    // }
    // if (tournament.status === 'active' || tournament.status === 'playoff') {
    //   throw new BadRequestError('Cannot delete tournament in active or playoff status');
    // }
    const deletedTournament = await this._tournamentRepository.delete(tournamentId);
    return deletedTournament;
  }

  async joinTournament(
    tournamentId: string,
    userId: string,
    password?: string
  ): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'pending')
      throw new BadRequestError('Tournament is not open for joining');
    const user = await this._userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (tournament.players.some((p) => p.userId.equals(userId))) {
      throw new BadRequestError('User already joined');
    }
    if (tournament.players.length >= tournament.maxPlayers) {
      throw new BadRequestError('Tournament is full');
    }
    if (!tournament.createdByAdmin && tournament.password) {
      if (!password) {
        throw new BadRequestError('Password is required');
      }
      const isPasswordValid = await bcrypt.compare(password, tournament.password);
      if (!isPasswordValid) {
        throw new BadRequestError('Invalid password');
      }
    }
    const updatedTournament = await this._tournamentRepository.addPlayer(tournamentId, userId);
    if (!updatedTournament) throw new BadRequestError('Failed to join tournament');
    return updatedTournament;
  }

  async leaveTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'pending' && tournament.status !== 'active') {
      throw new BadRequestError('Cannot leave tournament in this state');
    }
    if (tournament.createdByAdmin && !tournament.createdBy) {
      // Admin-created tournaments allow leaving without creator check
    } else if (tournament.createdBy && tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new BadRequestError('Tournament creator cannot leave');
    }
    if (!tournament.players.some((p) => p.userId.equals(userId))) {
      throw new BadRequestError('User not in tournament');
    }
    const updatedTournament = await this._tournamentRepository.removePlayer(tournamentId, userId);
    if (!updatedTournament) throw new BadRequestError('Failed to leave tournament');
    if (tournament.status === 'active' && updatedTournament.players.length < 2) {
      updatedTournament.status = 'cancelled';
      await this._tournamentRepository.update(tournamentId, updatedTournament);
    }
    return updatedTournament;
  }

  async startTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.createdByAdmin) {
      const admin = await this._adminRepository.findById(userId);
      if (!admin) throw new BadRequestError('Only an admin can start this tournament');
    } else if (!tournament.createdBy || !tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new BadRequestError('Only creator can start tournament');
    }
    if (tournament.status !== 'pending') throw new BadRequestError('Tournament already started');
    if (tournament.players.length < 2) throw new BadRequestError('Need at least 2 players');
    tournament.status = 'active';
    tournament.startDate = Date.now();
    const updatedTournament = await this._tournamentRepository.update(tournamentId, tournament);
    if (!updatedTournament) throw new BadRequestError('Failed to start tournament');
    return updatedTournament;
  }

  async getTournaments(
    page: number,
    limit: number
  ): Promise<{ tournaments: ITournament[]; total: number }> {
    const skip = (page - 1) * limit;
    const tournaments = await this._tournamentRepository.findAllPaginated(skip, limit);
    const total = await this._tournamentRepository.countDocuments();
    return { tournaments, total };
  }

  async getTournament(tournamentId: string): Promise<ITournament | null> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    return tournament;
  }

  async findByUserId(userId: string): Promise<ITournament[]> {
    return this._tournamentRepository.findByUserId(userId);
  }

  async submitResult(
    tournamentId: string,
    matchId: string,
    result: '1-0' | '0-1' | '0.5-0.5',
    userId: string
  ): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'active') throw new BadRequestError('Tournament is not active');

    const match = tournament.matches.find((m) => m._id.toString() === matchId);
    if (!match) throw new NotFoundError('Match');

    const userObjectId = new Types.ObjectId(userId);
    if (!match.player1Id.equals(userObjectId) && !match.player2Id.equals(userObjectId)) {
      throw new BadRequestError('User is not a participant in this match');
    }

    // If match already has a result, check if it matches the submitted result
    if (match.result) {
      if (match.result === result) {
        // Duplicate submission with same result, return the tournament
        return tournament;
      }
      throw new BadRequestError('Match already has a different result');
    }

    // Set the result and update player stats
    match.result = result;
    this.updatePlayerStats(tournament, match, result);

    // Save the updated tournament
    await this._tournamentRepository.update(tournamentId, tournament);
    return tournament;
  }

  private updatePlayerStats(
    tournament: ITournament,
    match: Match,
    result: '1-0' | '0-1' | '0.5-0.5'
  ) {
    const player1 = tournament.players.find((p) => p.userId.equals(match.player1Id));
    const player2 = tournament.players.find((p) => p.userId.equals(match.player2Id));

    if (!player1 || !player2) {
      throw new BadRequestError('Player not found in tournament');
    }

    if (result === '1-0') {
      player1.points += 1;
      player1.wins += 1;
      player2.losses += 1;
    } else if (result === '0-1') {
      player2.points += 1;
      player2.wins += 1;
      player1.losses += 1;
    } else if (result === '0.5-0.5') {
      player1.points += 0.5;
      player2.points += 0.5;
      player1.draws += 1;
      player2.draws += 1;
    }

    player1.gamesPlayed += 1;
    player2.gamesPlayed += 1;
  }

  async submitPlayoffResult(
    tournamentId: string,
    result: '1-0' | '0-1',
    userId: string
  ): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'playoff') throw new BadRequestError('Not in playoff');
    if (!tournament.playoffMatch) throw new BadRequestError('No playoff match');

    const userObjectId = new Types.ObjectId(userId);
    if (
      !tournament.playoffMatch.player1Id.equals(userObjectId) &&
      !tournament.playoffMatch.player2Id.equals(userObjectId)
    ) {
      throw new BadRequestError('User not in playoff');
    }

    // If playoff match already has a result, check if it matches
    if (tournament.playoffMatch.result) {
      if (tournament.playoffMatch.result === result) {
        return tournament;
      }
      throw new BadRequestError('Playoff match already has a different result');
    }

    tournament.playoffMatch.result = result;
    tournament.status = 'completed';
    const updatedTournament = await this._tournamentRepository.update(tournamentId, tournament);
    if (!updatedTournament) throw new BadRequestError('Failed to update playoff');
    return updatedTournament;
  }

  async pairMatch(
    tournamentId: string,
    userId: string
  ): Promise<{
    matchId: string;
    opponentId: string;
    opponentUsername: string;
    timeControl: string;
  } | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }
    const tournament = await this._tournamentRepository.findByIdWithPopulation(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'active') throw new BadRequestError('Tournament not active');

    const player = tournament.players.find((p) => p.userId._id.equals(userId));
    if (!player || player.gamesPlayed >= tournament.maxGames) return null;

    const recentOpponents = tournament.matches
      .filter(
        (m) => (m.player1Id.equals(userId) || m.player2Id.equals(userId)) && m.result !== null
      )
      .map((m) => (m.player1Id.equals(userId) ? m.player2Id : m.player1Id));

    const available = tournament.players.filter(
      (p) =>
        !p.userId._id.equals(userId) &&
        p.gamesPlayed < tournament.maxGames &&
        !recentOpponents.some((opp) => opp.equals(p.userId._id))
    );

    if (available.length === 0) return null;

    const opponent = available[Math.floor(Math.random() * available.length)];
    const updatedTournament = await this._tournamentRepository.createMatch(
      tournamentId,
      userId,
      opponent.userId._id.toString()
    );
    if (!updatedTournament) throw new BadRequestError('Failed to create match');

    const newMatch = updatedTournament.matches[updatedTournament.matches.length - 1];
    const opponentUser = opponent.userId as unknown as { _id: Types.ObjectId; username: string };
    if (!opponentUser.username) {
      throw new BadRequestError('Opponent username not found');
    }

    return {
      matchId: newMatch._id.toString(),
      opponentId: opponent.userId._id.toString(),
      opponentUsername: opponentUser.username,
      timeControl: tournament.timeControl,
    };
  }
}
