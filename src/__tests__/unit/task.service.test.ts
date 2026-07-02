import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "@prisma/client";

vi.mock("../../lib/prisma.js", () => ({
	default: {
		task: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import prisma from "../../lib/prisma.js";
import * as taskService from "../../services/task.service.js";

const mockTask: Task = {
	id: 1,
	title: "Test Task",
	description: "Test description",
	completed: false,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

describe("TaskService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findAll", () => {
		it("should return tasks", async () => {
			vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

			const result = await taskService.findAll();

			expect(result).toEqual([mockTask]);

			expect(prisma.task.findMany).toHaveBeenCalledWith({
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("findById", () => {
		it("should return task", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);

			const result = await taskService.findById(1);

			expect(result).toEqual(mockTask);

			expect(prisma.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should return null if task does not exist", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

			const result = await taskService.findById(999);

			expect(result).toBeNull();
		});
	});

	describe("create", () => {
		it("should create task", async () => {
			vi.mocked(prisma.task.create).mockResolvedValue(mockTask);

			const result = await taskService.create({
				title: "Test Task",
				description: "Test description",
			});

			expect(result).toEqual(mockTask);

			expect(prisma.task.create).toHaveBeenCalledWith({
				data: {
					title: "Test Task",
					description: "Test description",
				},
			});
		});
	});

	describe("update", () => {
		it("should update existing task", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);

			vi.mocked(prisma.task.update).mockResolvedValue({
				...mockTask,
				completed: true,
			});

			const result = await taskService.update(1, {
				completed: true,
			});

			expect(result.completed).toBe(true);

			expect(prisma.task.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					completed: true,
				},
			});
		});

		it("should throw if task not found", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

			await expect(
				taskService.update(1, {
					completed: true,
				}),
			).rejects.toThrow("Task not found");
		});
	});

	describe("remove", () => {
		it("should delete existing task", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);

			vi.mocked(prisma.task.delete).mockResolvedValue(mockTask);

			const result = await taskService.remove(1);

			expect(result).toEqual(mockTask);

			expect(prisma.task.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should throw if task not found", async () => {
			vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

			await expect(taskService.remove(1)).rejects.toThrow(
				"Task not found",
			);
		});
	});
});