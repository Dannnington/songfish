import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../../schema/schemas";

const metadata = {
    name: "loop",
    type: "CommandInteraction",
    proctorOnly: false,
    dmCommand: false,
    builder: new SlashCommandBuilder()
        .setDescription("Configure Songfish's loop modes (current track or entire queue)")
        .addStringOption(opt => 
            opt.setName("mode")
                .setDescription("Select a mode . Choose an option, or leave blank to disable.")
                .setRequired(false)
                .addChoices(
                    { name: "Track", value: "track" },
                    { name: "Queue", value: "queue" },
                    { name: "Disable", value: "disable" }
                )),
    i18n: {
        "default": {
            voiceChannelRequired: "🤔 You must be in my voice channel to use this command!",
            notInVoiceChannel: "🤔 I'm not in a voice channel!",
            alreadyInChannel: "😔😔 I'm already in another voice channel (%s).",
            loopSet: "%e The queue mode has been changed (**%s**)",
        }
    }
};

async function execute(ctx, interaction) {
    await interaction.deferReply();
    if (!interaction.member?.voice?.channel && !interaction.guild?.members?.voice?.channel) {
        return await interaction.editReply(metadata.i18n[`${metadata.i18n[interaction.locale] ? interaction.locale : "default"}`].voiceChannelRequired);
    } else {
        if (interaction.guild?.members?.me?.voice.channel && interaction.guild?.members?.me?.voice.channel.id !== interaction.member?.voice?.channel?.id) {
            return await interaction.editReply(metadata.i18n[`${metadata.i18n[interaction.locale] ? interaction.locale : "default"}`].alreadyInChannel.replace("%s", interaction.guild?.members?.me?.voice?.channel));
        };
        if (!interaction.guild?.members?.me?.voice.channel) {
            return await interaction.editReply(metadata.i18n[`${metadata.i18n[interaction.locale] ? interaction.locale : "default"}`].notInVoiceChannel);
        };

        const mode = interaction.options.getString("mode");

        let player = await ctx.PoruManager.fetchPlayer(interaction.guildId, interaction.channel.id, interaction.member.voice.channel.id);
        if (!player.isConnected) {
            await player.reconnect();
        };

        let friendlyQueueType = "Disabled";
        let queueEmoji = "🔁";
        if (mode === "track") {
            friendlyQueueType = "Track";
            queueEmoji = "🔂";
            await player.TrackRepeat();
        } else if (mode === "queue") {
            friendlyQueueType = "Queue";
            await player.QueueRepeat();
        } else {
            await player.DisableRepeat();
        };

        await interaction.editReply(metadata.i18n[`${metadata.i18n[interaction.locale] ? interaction.locale : "default"}`].loopSet.replace("%s", friendlyQueueType).replace("%e", queueEmoji));
    };
};

export { metadata, execute };