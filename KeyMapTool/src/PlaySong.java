import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.LinkedList;

import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;

public class PlaySong 
{
	public static void main(String[] args)
	{
		File sample = new File("sample.wav");
		PlaySound(sample);
	}

	static void PlaySound(File Sound)
	{
		try{
			Clip clip = AudioSystem.getClip();
			clip.open(AudioSystem.getAudioInputStream(Sound));
			clip.start();
			// Sample linked list for lyric catching 
			LinkedList <String> lyrics = new LinkedList<String>();
			lyrics.add("black");
			lyrics.add("then");
			lyrics.add("white");
			lyrics.add("are");
			lyrics.add("all");
			lyrics.add("I");
			lyrics.add("see");

			StringBuilder sb = new StringBuilder();

			while(clip.getMicrosecondLength() != clip.getMicrosecondPosition() || lyrics.isEmpty() != true )
			{
				System.in.read();
				long unixTime = System.currentTimeMillis();
				String line = "";
				if (lyrics.isEmpty() != true)
				{
					line += "\"" + lyrics.removeFirst() + "\"";
				}
				line += "," + unixTime;
				line = String.format("%s%n", line);
				sb.append(line);
			}

			PrintWriter printWriter = null;
			try {
				printWriter = new PrintWriter ("output.txt");
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			printWriter.println(sb.toString());
			printWriter.close();
			System.out.println(sb.toString());

		}catch(Exception e)
		{

		}





	}




}
