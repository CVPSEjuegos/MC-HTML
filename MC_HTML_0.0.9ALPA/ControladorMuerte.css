using UnityEngine;
using UnityEngine.SceneManagement;

public class ControladorMuerte : MonoBehaviour
{
    public GameObject pantallaMuerte;

    public void PersonajeMurio()
    {
        // Activamos el menú
        pantallaMuerte.SetActive(true);
        
        // Desbloqueamos el mouse para poder hacer clic
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;

        // Opcional: Pausar el juego
        // Time.timeScale = 0f; 
    }

    public void Reaparecer()
    {
        // Recomienza la escena actual
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    public void IrAlMenu()
    {
        Time.timeScale = 1f;
        // Cambia "NombreDeTuMenu" por el nombre real de tu escena de menú
        SceneManager.LoadScene("NombreDeTuMenu"); 
    }
}
