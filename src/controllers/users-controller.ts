import assert from "node:assert";
import * as userFollowsQueries from "#src/queries/user-follows-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors/errors.js";
import type {
  FollowersResponse,
  FollowingsResponse,
} from "#src/types/routes/users.js";

export async function createFollowerForTargetUser(
  req: Request<{ userId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");
  const { userId } = req.params;

  try {
    await userFollowsQueries.followUser(req.user.id, userId);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function getFollowers(
  req: Request<{ userId: string }>,
  res: Response<FollowersResponse | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");
  const { userId } = req.params;
  const { count } = req.query;

  try {
    if (count && count === "true") {
      const numOfFollowers = await userFollowsQueries.getNumOfFollowers(userId);
      res.json({ count: numOfFollowers });
      return;
    }

    const followers = await userFollowsQueries.getFollowers(userId);
    res.json({ followers });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    next(error);
  }
}

export async function deleteFollowerOfTargetUser(
  req: Request<{ userId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");
  const { userId } = req.params;

  try {
    await userFollowsQueries.unfollowUser(req.user.id, userId);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function getFollowings(
  req: Request<{ userId: string }>,
  res: Response<FollowingsResponse | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");
  const { userId } = req.params;
  const { count } = req.query;
  try {
    if (count && count === "true") {
      const numOfFollowings =
        await userFollowsQueries.getNumOfFollowing(userId);
      res.json({ count: numOfFollowings });
      return;
    }

    const followings = await userFollowsQueries.getFollowings(userId);
    res.json({ followings: followings });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
