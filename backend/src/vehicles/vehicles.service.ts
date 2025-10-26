import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  public constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {}

  // ===== POST METHODS =====

  public async create(clientId: number, dto: CreateVehicleDto): Promise<void> {
    await this.ensureLicensePlateIsAvailable(dto.licensePlate);

    const vehicle = this.vehiclesRepository.create({
      ...dto,
      clientId,
    });

    await this.vehiclesRepository.save(vehicle);
  }

  // ===== GET METHODS =====

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

  // ===== PATCH METHODS =====

  public async update(
    id: number,
    dto: UpdateVehicleDto,
  ): Promise<void> {
    const vehicle = await this.findOne(id);

    if (dto.color && dto.color === vehicle.color) {
      throw new BadRequestException(
        'New color must be different from the current one',
      );
    }
    Object.assign(vehicle, dto);

    await this.vehiclesRepository.save(vehicle);
  }

  // ===== DELETE METHODS =====

  public async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);

    await this.vehiclesRepository.remove(vehicle);
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
