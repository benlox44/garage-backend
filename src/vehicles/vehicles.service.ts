import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';

import { type VehicleStatus } from '../common/constants/vehicle-status.constant.js';

@Injectable()
export class VehiclesService {
  public constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {}

  // ===== POST METHODS =====

  public async create(clientId: number, dto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensureLicensePlateIsAvailable(dto.licensePlate);

    const vehicle = this.vehiclesRepository.create({
      ...dto,
      clientId,
    });

    return await this.vehiclesRepository.save(vehicle);
  }

  // ===== GET METHODS =====

  public async findAll(
    user: { sub: number; role: string },
    clientId: number | undefined,
    status: string | undefined,
    licensePlate: string | undefined,
  ): Promise<Vehicle[]> {
    const where: FindOptionsWhere<Vehicle> = {};

    if (user.role === 'CLIENT') {
      where.clientId = user.sub;
    }
    else if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status as VehicleStatus;
    }

    if (licensePlate) {
      where.licensePlate = licensePlate;
    }

    return await this.vehiclesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  public async findAllByClient(clientId: number): Promise<Vehicle[]> {
    return await this.vehiclesRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  public async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  public async findByLicensePlate(licensePlate: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with license plate ${licensePlate} not found`,
      );
    }

    return vehicle;
  }

  // ===== PATCH METHODS =====

  public async update(
    id: number,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    Object.assign(vehicle, dto);

    return await this.vehiclesRepository.save(vehicle);
  }

  // ===== DELETE METHODS =====

  public async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);

    await this.vehiclesRepository.remove(vehicle);
  }

  // ===== STATUS METHODS =====

  public async updateStatus(id: number, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return await this.vehiclesRepository.save(vehicle);
  }

  // ===== AUXILIARY METHODS =====

  private async ensureLicensePlateIsAvailable(licensePlate: string): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
    });

    if (existingVehicle) {
      throw new ConflictException(
        'License plate already exists',
      );
    }
  }
}
