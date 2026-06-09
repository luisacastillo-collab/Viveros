using System;
using System.Collections.Generic;
using System.Text;
using System.Data.SqlClient;

public class Class1
{
	public Class1()
	{

		SqlConnection cnx; 

		public Conexion()

		{
			try
			{
                cnx = new SqlConnection("Data Source =LAPTOP-T1HHTGKO;Initial Catalog = AniwalksFin; User ID=userAni;Password=root");
				cnx.Open(); 
				MessageBoox.Show("Conectado correctamente")
            }
			catch
			{

			}


		}	

	}
}
