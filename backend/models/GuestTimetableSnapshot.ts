import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from "sequelize";
import db from "./index";

interface GuestTimetableSnapshotCreationAttributes
  extends Optional<
    InferCreationAttributes<GuestTimetableSnapshotModel>,
    "id" | "last_synced_at" | "created_at" | "updated_at"
  > {}

class GuestTimetableSnapshotModel extends Model<
  InferAttributes<GuestTimetableSnapshotModel>,
  GuestTimetableSnapshotCreationAttributes
> {
  declare id: number;
  declare client_id: string;
  declare semester: string;
  declare course_ids: number[];
  declare last_synced_at: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

GuestTimetableSnapshotModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    semester: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    course_ids: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "GuestTimetableSnapshots",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uniq_guest_timetable_snapshots_client_semester",
        unique: true,
        fields: ["client_id", "semester"],
      },
      {
        name: "idx_guest_timetable_snapshots_semester_synced_at",
        fields: ["semester", "last_synced_at"],
      },
    ],
  }
);

export default GuestTimetableSnapshotModel;
