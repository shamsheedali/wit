import { inject, injectable } from 'inversify';
import { Model, Types } from 'mongoose';
import TYPES from '../../config/types';
import TournamentRepository from '../repositories/tournament.repository';
import UserRepository from '../repositories/user.repository';
import AdminRepository from '../repositories/admin.repository';
import { ITournament } from '../models/tournament.model';
import { GameType } from '../models/game.model';

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
    createdByAdmin = false
  ): Promise<ITournament> {
    let creator;
    if (createdByAdmin) {
      creator = await this._adminRepository.findById(createdBy);
      if (!creator) throw new Error('Admin not found');
    } else {
      creator = await this._userRepository.findById(createdBy);
      if (!creator) throw new Error('User not found');
    }

    const tournamentData: Partial<ITournament> = {
      name,
      type: 'league',
      gameType,
      timeControl,
      maxGames,
      createdBy: new Types.ObjectId(createdBy),
      createdByAdmin,
      players: [],
      matches: [],
    };

    const tournament = await this._tournamentRepository.create(tournamentData);
    if (!createdByAdmin) {
      await this._tournamentRepository.addPlayer(tournament._id as string, createdBy);
    }
    return tournament;
  }

  async deleteTournament(tournamentId: string, userId?: string): Promise<ITournament | null> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.createdByAdmin) throw new Error('Cannot delete admin-created tournament');
    if (!tournament.createdBy || !tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new Error('Only the creator can delete the tournament');
    }
    if (tournament.status === 'active' || tournament.status === 'playoff') {
      throw new Error('Cannot delete tournament in active or playoff status');
    }
    const deletedTournament = await this._tournamentRepository.delete(tournamentId);
    return deletedTournament;
  }

  async joinTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'pending') throw new Error('Tournament is not open for joining');
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    if (tournament.players.some((p) => p.userId.equals(userId))) {
      throw new Error('User already joined');
    }
    const updatedTournament = await this._tournamentRepository.addPlayer(tournamentId, userId);
    if (!updatedTournament) throw new Error('Failed to join tournament');
    return updatedTournament;
  }

  async leaveTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'pending' && tournament.status !== 'active') {
      throw new Error('Cannot leave tournament in this state');
    }
    if (tournament.createdByAdmin && !tournament.createdBy) {
      // Admin-created tournaments allow leaving without creator check
    } else if (tournament.createdBy && tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new Error('Tournament creator cannot leave');
    }
    if (!tournament.players.some((p) => p.userId.equals(userId))) {
      throw new Error('User not in tournament');
    }
    const updatedTournament = await this._tournamentRepository.removePlayer(tournamentId, userId);
    if (!updatedTournament) throw new Error('Failed to leave tournament');
    if (tournament.status === 'active' && updatedTournament.players.length < 2) {
      updatedTournament.status = 'cancelled';
      await this._tournamentRepository.update(tournamentId, updatedTournament);
    }
    return updatedTournament;
  }

  async startTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.createdByAdmin) {
      const admin = await this._adminRepository.findById(userId);
      if (!admin) throw new Error('Only an admin can start this tournament');
    } else if (!tournament.createdBy || !tournament.createdBy.equals(new Types.ObjectId(userId))) {
      throw new Error('Only creator can start tournament');
    }
    if (tournament.status !== 'pending') throw new Error('Tournament already started');
    if (tournament.players.length < 2) throw new Error('Need at least 2 players');
    tournament.status = 'active';
    tournament.startDate = Date.now();
    const updatedTournament = await this._tournamentRepository.update(tournamentId, tournament);
    if (!updatedTournament) throw new Error('Failed to start tournament');
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
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'active') throw new Error('Tournament not active');

    const match = tournament.matches.find((m) => m._id?.toString() === matchId);
    if (!match) throw new Error('Match not found');
    if (!match.player1Id.equals(userId) && !match.player2Id.equals(userId)) {
      throw new Error('User not in match');
    }
    if (match.result) throw new Error('Match already has result');

    match.result = result;
    const player1 = tournament.players.find((p) => p.userId.equals(match.player1Id));
    const player2 = tournament.players.find((p) => p.userId.equals(match.player2Id));
    if (!player1 || !player2) throw new Error('Player not found');

    player1.gamesPlayed += 1;
    player2.gamesPlayed += 1;

    if (result === '1-0') {
      player1.points += 3;
      player1.wins += 1;
      player2.losses += 1;
    } else if (result === '0-1') {
      player2.points += 3;
      player2.wins += 1;
      player1.losses += 1;
    } else {
      player1.points += 1;
      player2.points += 1;
      player1.draws += 1;
      player2.draws += 1;
    }

    const allDone = tournament.players.every((p) => p.gamesPlayed >= tournament.maxGames);
    if (allDone) {
      const maxPoints = Math.max(...tournament.players.map((p) => p.points));
      const topPlayers = tournament.players.filter((p) => p.points === maxPoints);
      if (topPlayers.length > 1) {
        tournament.status = 'playoff';
        tournament.playoffMatch = {
          player1Id: topPlayers[0].userId,
          player2Id: topPlayers[1].userId,
        };
      } else {
        tournament.status = 'completed';
      }
    }

    const updatedTournament = await this._tournamentRepository.update(tournamentId, tournament);
    if (!updatedTournament) throw new Error('Failed to update tournament');
    return updatedTournament;
  }

  async submitPlayoffResult(
    tournamentId: string,
    result: '1-0' | '0-1',
    userId: string
  ): Promise<ITournament> {
    const tournament = await this._tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'playoff') throw new Error('Not in playoff');
    if (!tournament.playoffMatch) throw new Error('No playoff match');
    if (
      !tournament.playoffMatch.player1Id.equals(userId) &&
      !tournament.playoffMatch.player2Id.equals(userId)
    ) {
      throw new Error('User not in playoff');
    }

    tournament.playoffMatch.result = result;
    tournament.status = 'completed';
    const updatedTournament = await this._tournamentRepository.update(tournamentId, tournament);
    if (!updatedTournament) throw new Error('Failed to update playoff');
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
      throw new Error('Invalid user ID');
    }
    const tournament = await this._tournamentRepository.findByIdWithPopulation(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'active') throw new Error('Tournament not active');

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
    if (!updatedTournament) throw new Error('Failed to create match');

    const newMatch = updatedTournament.matches[updatedTournament.matches.length - 1];
    const opponentUser = opponent.userId as unknown as { _id: Types.ObjectId; username: string };
    if (!opponentUser.username) {
      throw new Error('Opponent username not found');
    }

    return {
      matchId: newMatch._id.toString(),
      opponentId: opponent.userId._id.toString(),
      opponentUsername: opponentUser.username,
      timeControl: tournament.timeControl,
    };
  }
}
