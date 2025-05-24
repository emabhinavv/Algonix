import { db } from "../libs/db.js"

export const createPlaylist = async (req, res) => {
    const { name, description } = req.body
    const userId = req.user.id
    try {
        const playlist = await db.playlist.create({
            data: {
                name,
                description,
                userId
            }
        })

        res.status(200).json({
            success: true,
            message: `Playlist created successfully`,
            playlist
        })
    } catch (error) {
        console.log(`Location : playlist.controller.js createPlaylist
            ${error}`);
        return res.status(500).json({
            error: "Failed to create playlist.",
        });
    }
}

export const getAllListDetails = async (req, res) => {
    try {
        const playlists = await db.playlist.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                problems: {
                    include: {
                        problem: true
                    }
                }
            }
        })
        if (!playlists) {
            return res.status(404).json({
                success: false,
                error: `Playlists not found`
            })
        }

        res.status(200).json({
            success: true,
            message: "Playlist fetched successfully",
            playlists
        })
    } catch (error) {
        console.log(`Location : playlist.controller. js getAllListDetails
            ${error}`);
        return res.status(500).json({
            error: "Failed to fetch all details of playlist.",
        });
    }
}

export const getPlaylistDetails = async (req, res) => {
    const { playlistId } = req.params
    try {
        const playlist = await db.playlist.findUnique({
            where: {
                id: playlistId,
                userId: req.user.id
            },
            include: {
                problems: {
                    include: {
                        problem: true
                    }
                }
            }
        })
        if (!playlist) {
            return res.status(404).json({
                success: false,
                error: `Playlist not found`
            })
        }
        res.status(200).json({
            success: true,
            message: "Playlist fetched successfully",
            playlist
        })
    } catch (error) {
        console.log(`Location : playlist.controller. js getPlaylistDetails
            ${error}`);
        return res.status(500).json({
            error: "Failed to fetch details of playlist.",
        });
    }
}


export const addProblemToPlaylist = async (req, res) => {
    const { playlistId } = req.params
    const { problemIds } = req.body

    try {
        if (!Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid or missing problemsId"
            })
        }
        // create records for each problem in the playlists

        const problemsInPlaylist = await db.problemsInPlaylist.createMany({
            data: problemIds.map((problemId) => ({
                playlistId,
                problemId
            }))
        })

        return res.status(201).json({
            success: true,
            message: `Problem added to playlist successfully`,
            problemsInPlaylist
        })
    } catch (error) {
        console.log(`Location : playlist.controller. js addProblemToPlaylist
            ${error}`);
        return res.status(500).json({
            error: "Failed to add problem to playlist.",
        });
    }
}

export const deletePlaylist = async (req, res) => {
    const { playlistId } = req.params

    try {
        const deletePlaylist = await db.playlist.delete({
            where: {
                playlistId
            }
        })

        return res.status(200).json({
            success: true,
            message: `Playlist Deleted successfully`,
            deletePlaylist
        })
    } catch (error) {
        console.log(`Location : playlist.controller. js deletePlaylist
            ${error}`);
        return res.status(500).json({
            error: "Failed to delete playlist.",
        });
    }
}

export const removeProblemFromPlaylist = async (req, res) => {
    const { playlistId } = req.params
    const { problemIds } = req.body
    try {
        if (!Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid or missing problemsId"
            })
        }
        const deleteProblem = await db.problemsInPlaylist.deleteMany({
            where: {
                playlistId,
                problemId: {
                    in: problemIds
                }
            }
        })

        res.status(200).json({
            success: true,
            message: `Problem removed from playlist successfully`
        })
    } catch (error) {
        console.log(`Location : playlist.controller. js removeProblemFromPlaylist
            ${error}`);
        return res.status(500).json({
            error: "Failed to remove problem from playlist.",
        });
    }
}
